import { verifyAdminRequest } from '@/lib/api/adminAuthMiddleware';
import { getPendingChefVerifications } from '@/lib/db/adminChefVerificationService';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { uid, error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const verifications = await getPendingChefVerifications();
        return NextResponse.json({ verifications });
    } catch (err) {
        console.error('[admin/verifications GET]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
