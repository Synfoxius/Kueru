import admin from 'firebase-admin';
import { adminDB } from '../firebase/backend_config';

const VERIFICATIONS_COLLECTION = 'verification_requests';
const USERS_COLLECTION = 'users';

/**
 * Fetch a specific chef verification record
 * @param {string} verificationId 
 */
export const getChefVerification = async (verificationId) => {
    const snap = await adminDB.collection(VERIFICATIONS_COLLECTION).doc(verificationId).get();
    if (!snap.exists) return null;
    return { verificationId: snap.id, ...snap.data() };
};

/**
 * Fetch all pending or under_review verifications for admins
 */
export const getPendingChefVerifications = async () => {
    const snap = await adminDB.collection(VERIFICATIONS_COLLECTION)
        .where('status', 'in', ['pending', 'under_review'])
        .orderBy('submittedAt', 'asc')
        .get();
        
    return snap.docs.map(doc => ({ verificationId: doc.id, ...doc.data() }));
};

/**
 * Fetch all verification records, newest first.
 */
export const getAllChefVerifications = async () => {
    const snap = await adminDB.collection(VERIFICATIONS_COLLECTION)
        .orderBy('submittedAt', 'desc')
        .limit(200)
        .get();

    return snap.docs.map(doc => ({ verificationId: doc.id, ...doc.data() }));
};

/**
 * Fetch verification records filtered by a single status, newest first.
 * @param {string} status - 'pending' | 'under_review' | 'approved' | 'rejected'
 */
export const getChefVerificationsByStatus = async (status) => {
    const snap = await adminDB.collection(VERIFICATIONS_COLLECTION)
        .where('status', '==', status)
        .orderBy('submittedAt', 'desc')
        .limit(200)
        .get();

    return snap.docs.map(doc => ({ verificationId: doc.id, ...doc.data() }));
};

/**
 * Admin action to approve, reject, or mark a verification as under review.
 * @param {string} verificationId 
 * @param {string} status - 'approved' | 'rejected' | 'under_review'
 * @param {string} reviewerId 
 * @param {string} note - internal note or rejection reason
 */
export const updateVerificationStatus = async (verificationId, status, reviewerId, note) => {
    await adminDB.runTransaction(async (transaction) => {
        const verificationRef = adminDB.collection(VERIFICATIONS_COLLECTION).doc(verificationId);
        const snap = await transaction.get(verificationRef);
        
        if (!snap.exists) {
            throw new Error("Verification record not found.");
        }
        
        const data = snap.data();
        const userId = data.userId;

        const updatePayload = {
            status,
            reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
            reviewedBy: reviewerId,
        };

        if (status === 'rejected') {
            updatePayload.rejectionReason = note;
        } else {
            updatePayload.notes = note;
        }

        transaction.update(verificationRef, updatePayload);

        // If approved, mark the user as verified
        if (status === 'approved') {
            const userRef = adminDB.collection(USERS_COLLECTION).doc(userId);
            transaction.update(userRef, { verified: true });
        }

        // Notify the user of the verification outcome
        if (status === 'approved' || status === 'rejected') {
            const notifRef = adminDB.collection('notifications').doc();
            transaction.set(notifRef, {
                recipientId: userId,
                senderId: null,
                type: status === 'approved' ? 'verification_approved' : 'verification_rejected',
                targetId: verificationId,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
    });
};
