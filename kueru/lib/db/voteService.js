import { db } from '../firebase/config';
import { doc, getDoc, setDoc, deleteDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { createNotification } from './notificationService';

const VOTES_COLLECTION = 'post_votes';

/**
 * Determine user's current stance (upvoted, downvoted, or none) across any target
 * @param {string} userId 
 * @param {string} targetId 
 */
export const getUserVoteOnTarget = async (userId, targetId) => {
    const voteRef = doc(db, VOTES_COLLECTION, `${userId}_${targetId}`);
    const snap = await getDoc(voteRef);
    if (!snap.exists()) return null;
    return snap.data().voteType; // 1 or -1
};

const TARGET_COLLECTION = {
    post: 'forum_posts',
    comment: 'comments',
};

const TARGET_FIELD = {
    post: 'upvotesCount',
    comment: 'upvotesCount',
};

/**
 * Cast or change a vote. Handles switching from upvote↔downvote automatically.
 * @param {string} userId
 * @param {string} targetId
 * @param {'post'|'comment'} targetType
 * @param {1|-1} voteValue
 */
export const castVote = async (userId, targetId, targetType, voteValue) => {
    const voteRef = doc(db, VOTES_COLLECTION, `${userId}_${targetId}`);
    const targetRef = doc(db, TARGET_COLLECTION[targetType], targetId);

    const existingSnap = await getDoc(voteRef);
    let pointDifference = voteValue;

    if (existingSnap.exists()) {
        const existingVote = existingSnap.data().voteType;
        if (existingVote === voteValue) return; // already voted same way
        pointDifference = voteValue - existingVote; // e.g. -1 to 1 = +2
    }

    await setDoc(voteRef, {
        userId,
        postId: targetId,
        voteType: voteValue,
        votedAt: serverTimestamp(),
    });

    const targetSnap = await getDoc(targetRef);
    if (targetSnap.exists()) {
        await updateDoc(targetRef, {
            [TARGET_FIELD[targetType]]: increment(pointDifference),
        });

        // Notify on upvotes (new or switch from downvote)
        if (voteValue === 1) {
            const targetAuthorId = targetSnap.data()?.userId;
            if (targetAuthorId && targetAuthorId !== userId) {
                const notifType = targetType === 'post' ? 'post_upvote' : 'comment_upvote';
                await createNotification(targetAuthorId, userId, notifType, targetId);
            }
        }
    }
};

/**
 * Remove an existing vote.
 */
export const removeVote = async (userId, targetId, targetType) => {
    const voteRef = doc(db, VOTES_COLLECTION, `${userId}_${targetId}`);
    const targetRef = doc(db, TARGET_COLLECTION[targetType], targetId);

    const existingSnap = await getDoc(voteRef);
    if (!existingSnap.exists()) return;

    const existingVote = existingSnap.data().voteType;
    await deleteDoc(voteRef);
    const targetSnap = await getDoc(targetRef);
    if (targetSnap.exists()) {
        await updateDoc(targetRef, {
            [TARGET_FIELD[targetType]]: increment(-existingVote),
        });
    }
};
