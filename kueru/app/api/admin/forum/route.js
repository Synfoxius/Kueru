import { verifyAdminRequest } from '@/lib/api/adminAuthMiddleware';
import { getAllPosts, getPostsByStatus } from '@/lib/db/adminForumService';
import { adminDB } from '@/lib/firebase/backend_config';
import { NextResponse } from 'next/server';

const VALID_STATUSES = ['available', 'pending', 'deleted', 'archived'];

async function enrichWithUsernames(posts) {
    const userIds = [...new Set(posts.map((p) => p.userId).filter(Boolean))];
    if (!userIds.length) return posts;

    const refs = userIds.map((id) => adminDB.collection('users').doc(id));
    const snaps = await adminDB.getAll(...refs);

    const usernameMap = {};
    snaps.forEach((snap) => {
        if (snap.exists) {
            usernameMap[snap.id] =
                snap.data().username ?? snap.data().displayName ?? snap.id;
        }
    });

    return posts.map((p) => ({
        ...p,
        authorUsername: usernameMap[p.userId] ?? p.userId ?? '—',
    }));
}

export async function GET(request) {
    const { uid, error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let posts =
            status && VALID_STATUSES.includes(status)
                ? await getPostsByStatus(status)
                : await getAllPosts();

        posts = await enrichWithUsernames(posts);
        return NextResponse.json({ posts });
    } catch (err) {
        console.error('[admin/forum GET]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
