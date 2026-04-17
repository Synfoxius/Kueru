import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getChallengeById, recordChallengeContribution } from '../db/challengeService';
import { recipeMatchesCondition } from './conditionUtil';

/**
 * Records a challenge contribution after a recipe is posted.
 * Called client-side immediately after createRecipe() succeeds.
 * Fire-and-forget — the caller should NOT await this.
 *
 * Only runs if the user explicitly linked their recipe to a challenge
 * via the "Link to Challenge" dropdown in the recipe form (recipe.challengeId is set).
 * If no challenge was selected, this function exits immediately.
 *
 * Legitimacy checks (in order):
 *  1. recipe.challengeId must be set (user opted in)
 *  2. User must have joined the challenge (userChallenges doc exists)
 *  3. Recipe must be posted within the challenge's start/end date window
 *  4. Recipe must satisfy the challenge's condition (tag checks etc.)
 *
 * @param {string} userId
 * @param {string} recipeId   - the newly created recipe's Firestore ID
 * @param {object} recipe     - the recipe payload (name, tags, challengeId, etc.)
 * @param {object} userDoc    - the user's Firestore profile (username, profileImage)
 */
export async function processChallengesOnRecipePost(userId, recipeId, recipe, userDoc) {
    const challengeId = recipe.challengeId;
    if (!challengeId) return; // User didn't link to any challenge

    // 1. Verify the user actually joined this challenge
    const ucSnap = await getDoc(doc(db, 'users', userId, 'userChallenges', challengeId));
    if (!ucSnap.exists()) return;

    // 2. Fetch the challenge definition
    const challenge = await getChallengeById(challengeId);
    if (!challenge) return;

    // 3. Check the recipe was posted within the challenge's date window
    const now = new Date();
    const start = challenge.startDate?.toDate?.() ?? new Date(challenge.startDate);
    const end = challenge.endDate?.toDate?.() ?? new Date(challenge.endDate);
    if (now < start || now > end) return;

    // 4. Check the recipe satisfies the challenge condition
    // This prevents gaming — selecting a "Vegetarian" challenge but posting a steak recipe.
    if (!recipeMatchesCondition(recipe, challenge.condition ?? null)) return;

    // All checks passed — record the contribution
    try {
        await recordChallengeContribution(
            userId,
            challengeId,
            recipeId,
            recipe,
            userDoc,
            challenge.challengeType,
            challenge.goalValue
        );
    } catch (err) {
        console.error(`Challenge tracking error for "${challenge.title}":`, err);
    }
}
