import { adminDB } from '@/lib/firebase/backend_config';
import { verifyAdminRequest } from '@/lib/api/adminAuthMiddleware';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { uid, error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const [usersSnap, recipesSnap, postsSnap, verificationsSnap] = await Promise.all([
            adminDB.collection('users').count().get(),
            adminDB.collection('recipes').count().get(),
            adminDB.collection('forum_posts').count().get(),
            adminDB.collection('verification_requests')
                .where('status', 'in', ['pending', 'under_review'])
                .count()
                .get(),
        ]);

        return NextResponse.json({
            users: usersSnap.data().count,
            recipes: recipesSnap.data().count,
            posts: postsSnap.data().count,
            pendingVerifications: verificationsSnap.data().count,
        });
    } catch (err) {
        console.error('[admin/stats]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
