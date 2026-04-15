import { db } from '../firebase/config';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

const ACHIEVEMENTS_COLLECTION = 'achievements';

/**
 * Fetches all achievement definitions from the top-level achievements collection.
 * Returns them ordered by category then title so sections are already sorted.
 *
 * @returns {Promise<Array<{ id: string, title: string, description: string, category: string, goalValue: number, unit: string, trackingType: string, iconURL: string }>>}
 */
export const getAllAchievements = async () => {
    const q = query(
        collection(db, ACHIEVEMENTS_COLLECTION),
        orderBy('category'),
        orderBy('title')
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Fetches a user's achievement progress from their userAchievements subcollection.
 * Returns a map keyed by achievementId for O(1) lookups when merging with achievement definitions.
 *
 * Subcollection path: users/{userId}/userAchievements/{achievementId}
 *
 * @param {string} userId
 * @returns {Promise<{ [achievementId: string]: { currentValue: number, status: string, lastUpdated: any, linkedRecipeIds: string[], metadata: object } }>}
 */
export const getUserAchievementProgress = async (userId) => {
    const subcolRef = collection(db, 'users', userId, 'userAchievements');
    const snap = await getDocs(subcolRef);
    return snap.docs.reduce((map, doc) => {
        map[doc.id] = doc.data();
        return map;
    }, {});
};