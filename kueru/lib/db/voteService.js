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
    await updateDoc(targetRef, {
        [TARGET_FIELD[targetType]]: increment(pointDifference),
    });

    // Notify on new upvotes only (not switches from downvote)
    if (voteValue === 1 && !existingSnap.exists()) {
        const targetSnap = await getDoc(targetRef);
        const targetData = targetSnap.data();
        const targetAuthorId = targetData?.userId;
        if (targetAuthorId) {
            const notifType = targetType === 'post' ? 'post_upvote' : 'comment_upvote';
            const extras = targetType === 'comment' && targetData?.postId ? { postId: targetData.postId } : {};
            await createNotification(targetAuthorId, userId, notifType, targetId, extras);
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
    await updateDoc(targetRef, {
        [TARGET_FIELD[targetType]]: increment(-existingVote),
    });
};
