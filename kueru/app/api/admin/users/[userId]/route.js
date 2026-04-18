import { adminDB, adminAuth } from '@/lib/firebase/backend_config';
import { verifyAdminRequest } from '@/lib/api/adminAuthMiddleware';
import { deleteUser } from '@/lib/db/adminUserService';
import { NextResponse } from 'next/server';

const VALID_ROLES    = ['admin', 'chef', 'customer'];
const VALID_STATUSES = ['active', 'disabled'];

export async function GET(request, { params }) {
    const { error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const { userId } = await params;
        const snap = await adminDB.collection('users').doc(userId).get();
        if (!snap.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({ user: { userId: snap.id, ...snap.data() } });
    } catch (err) {
        console.error('[admin/users GET single]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    const { uid, error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const { userId } = await params;
        const body = await request.json();
        const update = {};

        if (body.role !== undefined) {
            if (!VALID_ROLES.includes(body.role)) {
                return NextResponse.json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` }, { status: 400 });
            }
            update.role = body.role;
        }

        if (body.status !== undefined) {
            if (!VALID_STATUSES.includes(body.status)) {
                return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
            }
            update.status = body.status;
        }

        if (Object.keys(update).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        await adminDB.collection('users').doc(userId).update(update);
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
