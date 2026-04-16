import { verifyAdminRequest } from '@/lib/api/adminAuthMiddleware';
import { getPost, updatePostStatus } from '@/lib/db/adminForumService';
import { adminDB } from '@/lib/firebase/backend_config';
import { NextResponse } from 'next/server';

const VALID_STATUSES = ['available', 'pending', 'deleted', 'archived'];

export async function GET(request, { params }) {
    const { uid, error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const { postId } = await params;
        const post = await getPost(postId);

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        if (post.userId) {
            const userSnap = await adminDB.collection('users').doc(post.userId).get();
            if (userSnap.exists) {
                post.authorUsername =
                    userSnap.data().username ?? userSnap.data().displayName ?? post.userId;
            }
        }

        return NextResponse.json({ post });
    } catch (err) {
        console.error('[admin/forum GET single]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    const { uid, error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const { postId } = await params;
        const { status } = await request.json();

        if (!VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
                { status: 400 }
            );
        }

        await updatePostStatus(postId, status);
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[admin/forum PATCH]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Soft delete — sets status to 'deleted' rather than removing the document
export async function DELETE(request, { params }) {
    const { uid, error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const { postId } = await params;
        await updatePostStatus(postId, 'deleted');
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[admin/forum DELETE]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
