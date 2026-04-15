import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import { getUser } from './userService';

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

/**
 * Follow a user. Atomically creates the follow doc and increments both counters.
 * @param {string} followerId - UID of the user doing the following
 * @param {string} followingId - UID of the user being followed
 */
export const followUser = async (followerId, followingId) => {
    const batch = writeBatch(db);
    batch.set(doc(db, FOLLOWS_COLLECTION, `${followerId}_${followingId}`), {
        followerId,
        followingId,
        createdAt: serverTimestamp(),
    });
    batch.update(doc(db, 'users', followingId), { followerCount: increment(1) });
    batch.update(doc(db, 'users', followerId), { followingCount: increment(1) });
    await batch.commit();
};

/**
 * Unfollow a user. Atomically deletes the follow doc and decrements both counters.
 * @param {string} followerId
 * @param {string} followingId
 */
export const unfollowUser = async (followerId, followingId) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, FOLLOWS_COLLECTION, `${followerId}_${followingId}`));
    batch.update(doc(db, 'users', followingId), { followerCount: increment(-1) });
    batch.update(doc(db, 'users', followerId), { followingCount: increment(-1) });
    await batch.commit();
};

/**
 * Get all followers of a user with their full profile data.
 * @param {string} userId
 */
export const getFollowersWithProfiles = async (userId) => {
    const follows = await getFollowers(userId);
    const profiles = await Promise.all(follows.map(f => getUser(f.followerId)));
    return profiles.filter(Boolean);
};

/**
 * Get all users a user is following with their full profile data.
 * @param {string} userId
 */
export const getFollowingWithProfiles = async (userId) => {
    const follows = await getFollowing(userId);
    const profiles = await Promise.all(follows.map(f => getUser(f.followingId)));
    return profiles.filter(Boolean);
};
