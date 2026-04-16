import { db } from '../firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAllAchievements } from '../db/achievementService';
import { createNotification } from '../db/notificationService';
import {
    handleCount,
    handleUniqueCount,
    handleExactMatch,
    handleStreak,
    handleWeeklyStreak,
} from './trackingHandlers';

const HANDLERS = {
    count: handleCount,
    unique_count: handleUniqueCount,
    exact_match: handleExactMatch,
    streak: handleStreak,
    weekly_streak: handleWeeklyStreak,
};

/**
 * Runs all achievement checks after a recipe is posted.
 * Called client-side immediately after createRecipe() succeeds.
 * Fire-and-forget — caller should not await this.
 *
 * @param {string} userId
 * @param {string} recipeId - the newly created recipe's Firestore ID
 * @param {object} recipe   - the payload passed to createRecipe (tags, ingredients, etc.)
 */
export async function processAchievementsOnRecipePost(userId, recipeId, recipe) {
    const achievements = await getAllAchievements();

    await Promise.all(
        achievements.map(async (achievement) => {
            const progressRef = doc(db, 'users', userId, 'userAchievements', achievement.id);
            const progressSnap = await getDoc(progressRef);
            const currentProgress = progressSnap.exists() ? progressSnap.data() : null;

            // Skip achievements already completed
            if (currentProgress?.status === 'completed') return;

            const handler = HANDLERS[achievement.trackingType];
            if (!handler) return;

            let update;
            try {
                update = await handler(userId, recipeId, recipe, achievement, currentProgress);
            } catch (err) {
                console.error(`Achievement tracking error for "${achievement.title}":`, err);
                return;
            }

            if (!update) return;

            await setDoc(
                progressRef,
                { ...update, lastUpdated: serverTimestamp() },
                { merge: true }
            );

            if (update.status === 'completed') {
                await createNotification(userId, null, 'achievement_completed', achievement.id);
            }
        })
    );
}
