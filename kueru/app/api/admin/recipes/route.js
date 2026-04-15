import { adminDB } from '@/lib/firebase/backend_config';
import { verifyAdminRequest } from '@/lib/api/adminAuthMiddleware';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { uid, error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const snap = await adminDB
            .collection('recipes')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();

        const recipes = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json({ recipes });
    } catch (err) {
        console.error('[admin/recipes GET]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
