import admin from 'firebase-admin';
import { adminDB } from '../firebase/backend_config';

const VOTES_COLLECTION = 'post_votes'; // Could abstract to general 'votes'
const FORUM_COLLECTION = 'forum_posts';
const RECIPES_COLLECTION = 'recipes';
const COMMENTS_COLLECTION = 'comments';

// Mapping target types to their collections and metric fields
const TARGET_MAP = {
    'post': { col: FORUM_COLLECTION, field: 'upvotesCount' },
    'recipe': { col: RECIPES_COLLECTION, field: 'upvotes' },
    'comment': { col: COMMENTS_COLLECTION, field: 'upvotesCount' }
};

/**
 * Casts or changes a vote and runs a transaction to adjust the target's upvote count.
 * @param {string} userId 
 * @param {string} targetId 
 * @param {string} targetType - 'post' | 'recipe' | 'comment'
 * @param {number} voteValue - e.g., 1 for upvote, -1 for downvote
 */
export const castVote = async (userId, targetId, targetType, voteValue) => {
    const targetConfig = TARGET_MAP[targetType];
    if (!targetConfig) throw new Error("Invalid target type for voting.");

    const voteRef = adminDB.collection(VOTES_COLLECTION).doc(`${userId}_${targetId}`);
    const targetRef = adminDB.collection(targetConfig.col).doc(targetId);

    await adminDB.runTransaction(async (transaction) => {
        const voteSnap = await transaction.get(voteRef);
        
        let pointDifference = voteValue;

        if (voteSnap.exists) {
            const existingVote = voteSnap.data().voteType;
            if (existingVote === voteValue) {
                // User is voting the exact same thing twice, do nothing or throw error
                throw new Error("Vote already cast.");
            }
            // If they had -1 and vote 1, difference is 2. 
            // If they had 1 and vote -1, difference is -2.
            pointDifference = voteValue - existingVote;
        }

        // Set or update vote document
        transaction.set(voteRef, {
            document_id: voteRef.id,
            userId,
            postId: targetId, // 'postId' used per schema but acts as 'targetId'
            voteType: voteValue,
            votedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update target count
        transaction.update(targetRef, {
            [targetConfig.field]: admin.firestore.FieldValue.increment(pointDifference)
        });
    });
};

/**
 * Removes user vote and runs a transaction to decrement target's upvote count.
 * @param {string} userId 
 * @param {string} targetId 
 * @param {string} targetType 
 */
export const removeVote = async (userId, targetId, targetType) => {
    const targetConfig = TARGET_MAP[targetType];
    if (!targetConfig) throw new Error("Invalid target type for voting.");

    const voteRef = adminDB.collection(VOTES_COLLECTION).doc(`${userId}_${targetId}`);
    const targetRef = adminDB.collection(targetConfig.col).doc(targetId);

    await adminDB.runTransaction(async (transaction) => {
        const voteSnap = await transaction.get(voteRef);
        
        if (!voteSnap.exists) {
            throw new Error("No existing vote to remove.");
        }

        const existingVote = voteSnap.data().voteType; // 1 or -1

        // Delete the vote record
        transaction.delete(voteRef);

        // Reverse the effect on the target (if they voted 1, we subtract 1)
        transaction.update(targetRef, {
            [targetConfig.field]: admin.firestore.FieldValue.increment(-existingVote)
        });
    });
};
