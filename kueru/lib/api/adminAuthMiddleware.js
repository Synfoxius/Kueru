import { adminAuth, adminDB } from '@/lib/firebase/backend_config';
import { NextResponse } from 'next/server';

/**
 * Verify that the incoming request comes from an authenticated admin user.
 *
 * Reads the Firebase ID token from `Authorization: Bearer <token>`, verifies it
 * with the Admin SDK, then checks that the corresponding Firestore user document
 * has `role === 'admin'`.
 *
 * Returns `{ uid }` on success, or `{ error: NextResponse }` on failure so the
 * caller can do:
 *   const { uid, error } = await verifyAdminRequest(request);
 *   if (error) return error;
 *
 * @param {Request} request
 * @returns {Promise<{ uid: string } | { error: NextResponse }>}
 */
export async function verifyAdminRequest(request) {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    const token = authorization.slice(7);
    let decoded;
    try {
        decoded = await adminAuth.verifyIdToken(token);
    } catch {
        return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) };
    }

    const userSnap = await adminDB.collection('users').doc(decoded.uid).get();
    if (!userSnap.exists || userSnap.data().role !== 'admin') {
        return { error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }) };
    }

    return { uid: decoded.uid };
}
