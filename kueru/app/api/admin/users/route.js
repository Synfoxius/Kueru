import { adminDB } from '@/lib/firebase/backend_config';
import { verifyAdminRequest } from '@/lib/api/adminAuthMiddleware';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { uid, error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const snap = await adminDB
            .collection('users')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();

        const users = snap.docs.map((doc) => ({ userId: doc.id, ...doc.data() }));
        return NextResponse.json({ users });
    } catch (err) {
        console.error('[admin/users GET]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
