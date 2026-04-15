import { verifyAdminRequest } from '@/lib/api/adminAuthMiddleware';
import { updateVerificationStatus } from '@/lib/db/adminChefVerificationService';
import { NextResponse } from 'next/server';

const VALID_STATUSES = ['approved', 'rejected', 'under_review'];

export async function PATCH(request, { params }) {
    const { uid, error } = await verifyAdminRequest(request);
    if (error) return error;

    try {
        const { verificationId } = await params;
        const { status, note } = await request.json();

        if (!VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
                { status: 400 }
            );
        }

        if (status === 'rejected' && !note?.trim()) {
            return NextResponse.json({ error: 'A rejection reason is required' }, { status: 400 });
        }

        await updateVerificationStatus(verificationId, status, uid, note ?? '');
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[admin/verifications PATCH]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
