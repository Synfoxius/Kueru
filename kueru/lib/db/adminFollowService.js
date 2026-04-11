import admin from 'firebase-admin';
import { adminDB } from '../firebase/backend_config';

const FOLLOWS_COLLECTION = 'follows';
const USERS_COLLECTION = 'users';

/**
 * Creates a follow doc and increments follower/following counts atomically.
 * @param {string} followerId - The person doing the following
 * @param {string} followingId - The person being followed
 */
export const followUser = async (followerId, followingId) => {
    if (followerId === followingId) throw new Error("A user cannot follow themselves.");

    const followRef = adminDB.collection(FOLLOWS_COLLECTION).doc(`${followerId}_${followingId}`);
    
    const followerUserRef = adminDB.collection(USERS_COLLECTION).doc(followerId);
    const followingUserRef = adminDB.collection(USERS_COLLECTION).doc(followingId);

    await adminDB.runTransaction(async (transaction) => {
        const followDoc = await transaction.get(followRef);
        if (followDoc.exists) {
            throw new Error("Already following this user.");
        }

        // Set Follow Document
        transaction.set(followRef, {
            followId: followRef.id,
            followerId,
            followingId,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Increment follower's `followingCount`
        transaction.update(followerUserRef, {
            followingCount: admin.firestore.FieldValue.increment(1)
        });

        // Increment following's `followerCount`
        transaction.update(followingUserRef, {
            followerCount: admin.firestore.FieldValue.increment(1)
        });
    });
};

/**
 * Removes a follow doc and decrements follower/following counts atomically.
 * @param {string} followerId - The person doing the following
 * @param {string} followingId - The person being followed
 */
export const unfollowUser = async (followerId, followingId) => {
    const followRef = adminDB.collection(FOLLOWS_COLLECTION).doc(`${followerId}_${followingId}`);
    
    const followerUserRef = adminDB.collection(USERS_COLLECTION).doc(followerId);
    const followingUserRef = adminDB.collection(USERS_COLLECTION).doc(followingId);

    await adminDB.runTransaction(async (transaction) => {
        const followDoc = await transaction.get(followRef);
        if (!followDoc.exists) {
            throw new Error("Not currently following this user.");
        }

        // Delete Follow Document
        transaction.delete(followRef);

        // Decrement follower's `followingCount`
        transaction.update(followerUserRef, {
            followingCount: admin.firestore.FieldValue.increment(-1)
        });

        // Decrement following's `followerCount`
        transaction.update(followingUserRef, {
            followerCount: admin.firestore.FieldValue.increment(-1)
        });
    });
};
