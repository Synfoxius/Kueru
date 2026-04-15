import { adminDB, adminAuth } from '@/lib/firebase/backend_config';
import { verifyAdminRequest } from '@/lib/api/adminAuthMiddleware';
import { deleteUser } from '@/lib/db/adminUserService';
import { NextResponse } from 'next/server';

const VALID_ROLES = ['admin', 'chef', 'customer'];

export async function PATCH(request, { params }) {
    const { uid, error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const { userId } = await params;
        const { role } = await request.json();

        if (!VALID_ROLES.includes(role)) {
            return NextResponse.json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` }, { status: 400 });
        }

        await adminDB.collection('users').doc(userId).update({ role });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[admin/users PATCH]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const { uid, error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const { userId } = await params;

        // Prevent admins from deleting themselves
        if (userId === uid) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        await deleteUser(userId);

        // Best-effort: also remove from Firebase Auth
        try {
            await adminAuth.deleteUser(userId);
        } catch (authErr) {
            console.warn('[admin/users DELETE] Could not remove Auth user:', authErr.message);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[admin/users DELETE]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
