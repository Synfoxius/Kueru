import admin from 'firebase-admin';
import { adminDB, adminAuth } from '../firebase/backend_config';

const VERIFICATIONS_COLLECTION = 'chef_verifications';
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

        // If approved, update the user's role to 'chef'
        if (status === 'approved') {
            const userRef = adminDB.collection(USERS_COLLECTION).doc(userId);
            transaction.update(userRef, { role: 'chef' });
            
            // Optionally, we could set custom auth claims here as well
            // await adminAuth.setCustomUserClaims(userId, { role: 'chef' });
        }
    });
};
