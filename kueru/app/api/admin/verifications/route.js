import { verifyAdminRequest } from '@/lib/api/adminAuthMiddleware';
import {
    getAllChefVerifications,
    getChefVerificationsByStatus,
} from '@/lib/db/adminChefVerificationService';
import { NextResponse } from 'next/server';

const VALID_STATUSES = ['pending', 'under_review', 'approved', 'rejected'];

export async function GET(request) {
    const { uid, error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const verifications =
            status && VALID_STATUSES.includes(status)
                ? await getChefVerificationsByStatus(status)
                : await getAllChefVerifications();

        return NextResponse.json({ verifications });
    } catch (err) {
        console.error('[admin/verifications GET]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
