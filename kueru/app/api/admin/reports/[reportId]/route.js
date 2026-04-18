import { adminDB } from '@/lib/firebase/backend_config';
import { verifyAdminRequest } from '@/lib/api/adminAuthMiddleware';
import { getRecipe } from '@/lib/db/adminRecipeService';
import { getPost } from '@/lib/db/adminForumService';
import { NextResponse } from 'next/server';

const VALID_STATUSES = ['pending', 'resolved'];

async function fetchTarget(targetType, targetId) {
    switch (targetType) {
        case 'recipe':
            return getRecipe(targetId);
        case 'post':
            return getPost(targetId);
        case 'comment': {
            const snap = await adminDB.collection('comments').doc(targetId).get();
            return snap.exists ? { id: snap.id, ...snap.data() } : null;
        }
        case 'user': {
            const snap = await adminDB.collection('users').doc(targetId).get();
            return snap.exists ? { id: snap.id, ...snap.data() } : null;
        }
        default:
            return null;
    }
}

export async function GET(request, { params }) {
    const { error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const { reportId } = await params;

        const reportSnap = await adminDB.collection('reports').doc(reportId).get();
        if (!reportSnap.exists) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        const report = { id: reportSnap.id, ...reportSnap.data() };

        // Enrich with reporter username
        if (report.userId) {
            const userSnap = await adminDB.collection('users').doc(report.userId).get();
            report.reporterUsername = userSnap.exists
                ? (userSnap.data().username ?? userSnap.data().displayName ?? report.userId)
                : report.userId;
        }

        // Fetch the reported target document
        const target = await fetchTarget(report.targetType, report.targetId);

        // Enrich target with author username for recipe/post/comment
        if (target?.userId && ['recipe', 'post', 'comment'].includes(report.targetType)) {
            const authorSnap = await adminDB.collection('users').doc(target.userId).get();
            target.authorUsername = authorSnap.exists
                ? (authorSnap.data().username ?? authorSnap.data().displayName ?? target.userId)
                : target.userId;
        }

        return NextResponse.json({ report, target });
    } catch (err) {
        console.error('[admin/reports GET]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    const { error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const { reportId } = await params;
        const { status } = await request.json();

        if (!VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
                { status: 400 }
            );
        }

        const ref = adminDB.collection('reports').doc(reportId);
        const snap = await ref.get();
        if (!snap.exists) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        await ref.update({ status });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[admin/reports PATCH]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
