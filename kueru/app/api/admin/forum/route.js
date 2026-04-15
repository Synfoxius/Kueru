import { adminDB } from '@/lib/firebase/backend_config';
import { verifyAdminRequest } from '@/lib/api/adminAuthMiddleware';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { uid, error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const snap = await adminDB
            .collection('forum_posts')
            .orderBy('postedDateTime', 'desc')
            .limit(100)
            .get();

        const posts = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json({ posts });
    } catch (err) {
        console.error('[admin/forum GET]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
