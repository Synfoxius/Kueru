import { adminDB } from '@/lib/firebase/backend_config';
import { verifyAdminRequest } from '@/lib/api/adminAuthMiddleware';
import { NextResponse } from 'next/server';

const VALID_STATUSES = ['pending', 'resolved'];

// Collection name for each target type
const TARGET_COLLECTION = {
    recipe:  'recipes',
    post:    'forum_posts',
    comment: 'comments',
    user:    'users',
};

// Extracts a human-readable label from a target document
function targetName(type, data) {
    switch (type) {
        case 'recipe':  return data.name ?? '(unnamed recipe)';
        case 'post':    return data.title ?? '(untitled post)';
        case 'comment': {
            const c = data.content ?? '';
            return c.length > 60 ? c.slice(0, 60) + '…' : c || '(empty comment)';
        }
        case 'user':    return data.username ? `@${data.username}` : '(unknown user)';
        default:        return null;
    }
}

async function enrichWithReporters(reports) {
    const userIds = [...new Set(reports.map((r) => r.userId).filter(Boolean))];
    if (!userIds.length) return reports;

    const refs = userIds.map((id) => adminDB.collection('users').doc(id));
    const snaps = await adminDB.getAll(...refs);

    const usernameMap = {};
    snaps.forEach((snap) => {
        if (snap.exists) {
            usernameMap[snap.id] = snap.data().username ?? snap.data().displayName ?? snap.id;
        }
    });

    return reports.map((r) => ({
        ...r,
        reporterUsername: usernameMap[r.userId] ?? r.userId ?? '—',
    }));
}

async function enrichWithTargetNames(reports) {
    // Group unique targetIds by type to minimise Firestore reads
    const grouped = {};
    for (const r of reports) {
        if (!r.targetType || !r.targetId) continue;
        if (!grouped[r.targetType]) grouped[r.targetType] = new Set();
        grouped[r.targetType].add(r.targetId);
    }

    const nameMap = {}; // "type:id" → human label

    await Promise.all(
        Object.entries(grouped).map(async ([type, ids]) => {
            const col = TARGET_COLLECTION[type];
            if (!col) return;
            const refs = [...ids].map((id) => adminDB.collection(col).doc(id));
            const snaps = await adminDB.getAll(...refs);
            snaps.forEach((snap) => {
                if (snap.exists) {
                    nameMap[`${type}:${snap.id}`] = targetName(type, snap.data());
                }
            });
        })
    );

    return reports.map((r) => ({
        ...r,
        targetName: nameMap[`${r.targetType}:${r.targetId}`] ?? null,
    }));
}

export async function GET(request) {
    const { error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let q = adminDB.collection('reports').orderBy('createdAt', 'desc').limit(200);
        if (status && VALID_STATUSES.includes(status)) {
            q = adminDB
                .collection('reports')
                .where('status', '==', status)
                .orderBy('createdAt', 'desc')
                .limit(200);
        }

        const snap = await q.get();
        let reports = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        [reports] = await Promise.all([
            enrichWithReporters(reports).then((r) => enrichWithTargetNames(r)),
        ]);

        return NextResponse.json({ reports });
    } catch (err) {
        console.error('[admin/reports GET]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
