import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, updateDoc, getDoc, getDocs, query, where, doc } from 'firebase/firestore';

const REPORTS_COLLECTION = 'reports';

const TARGET_COLLECTION = {
    post: 'forum_posts',
    recipe: 'recipes',
    user: 'users',
};

// Target types where the source doc should be flagged as "Reported"
const FLAGGABLE_TYPES = new Set(['post', 'recipe']);

/**
 * Create a report for any target type.
 * @param {string} targetId - ID of the reported item
 * @param {'post'|'recipe'|'user'} targetType - type of the reported item
 * @param {string} userId - userId of the reporter
 * @param {string} reason - predefined reason
 * @param {string|null} details - optional free text
 */
export const hasUserReported = async (targetId, userId) => {
    const q = query(
        collection(db, REPORTS_COLLECTION),
        where('targetId', '==', targetId),
        where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    return !snap.empty;
};

export const createReport = async (targetId, targetType, userId, reason, details = null) => {
    const alreadyReported = await hasUserReported(targetId, userId);
    if (alreadyReported) { throw new Error('already_reported'); }

    await addDoc(collection(db, REPORTS_COLLECTION), {
        targetId,
        targetType,
        userId,
        reason,
        details: details || null,
        createdAt: serverTimestamp(),
        status: 'pending',
    });

    // Flag the target so admins can filter quickly (skip for user reports)
    const col = TARGET_COLLECTION[targetType];
    if (col && FLAGGABLE_TYPES.has(targetType)) {
        const targetRef = doc(db, col, targetId);
        const targetSnap = await getDoc(targetRef);
        if (targetSnap.exists()) {
            await updateDoc(targetRef, { status: 'Reported' });
        }
    }
};
