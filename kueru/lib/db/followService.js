import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const FOLLOWS_COLLECTION = 'follows';

/**
 * Get all users following the specified user
 * @param {string} userId
 */
export const getFollowers = async (userId) => {
    const followsRef = collection(db, FOLLOWS_COLLECTION);
    const q = query(followsRef, where('followingId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get all users the specified user is following
 * @param {string} userId 
 */
export const getFollowing = async (userId) => {
    const followsRef = collection(db, FOLLOWS_COLLECTION);
    const q = query(followsRef, where('followerId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Check if a follow document exists
 * @param {string} followerId 
 * @param {string} followingId 
 */
export const checkIfFollowing = async (followerId, followingId) => {
    // Relying on predictable ID format
    const followRef = doc(db, FOLLOWS_COLLECTION, `${followerId}_${followingId}`);
    const snap = await getDoc(followRef);
    return snap.exists();
};
