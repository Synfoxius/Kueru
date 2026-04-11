import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

const VERIFICATIONS_COLLECTION = 'chef_verifications';

/**
 * Submit a request to be verified as a chef
 * @param {string} userId 
 * @param {Array} documents - Array of document objects { type, url, filename, uploadedAt }
 */
export const submitChefVerification = async (userId, documents) => {
    const verificationsRef = collection(db, VERIFICATIONS_COLLECTION);
    const docRef = await addDoc(verificationsRef, {
        userId,
        documents,
        status: 'pending',
        submittedAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: null,
        notes: null
    });
    
    return { verificationId: docRef.id };
};

/**
 * Check if the user already has a pending or completed verification
 * @param {string} userId 
 */
export const getUserPendingVerification = async (userId) => {
    const verificationsRef = collection(db, VERIFICATIONS_COLLECTION);
    const q = query(verificationsRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    
    if (snap.empty) return null;
    
    // Sort client side or return the latest
    const verifications = snap.docs.map(doc => ({ verificationId: doc.id, ...doc.data() }));
    // Assuming you mostly care about an active ongoing one:
    return verifications.find(v => v.status === 'pending' || v.status === 'under_review') || verifications[0];
};
