import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

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
    return snap.data().voteType; // E.g. expected 1 or -1
};
