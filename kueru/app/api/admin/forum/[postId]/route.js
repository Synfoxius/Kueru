import { verifyAdminRequest } from '@/lib/api/adminAuthMiddleware';
import { deletePost } from '@/lib/db/adminForumService';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
    const { uid, error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const { postId } = await params;
        await deletePost(postId);
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[admin/forum DELETE]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
