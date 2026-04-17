import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getChallengeById, recordChallengeContribution } from '../db/challengeService';
import { recipeMatchesCondition } from './conditionUtil';

/**
 * Runs all challenge checks after a recipe is posted.
 * Called client-side immediately after createRecipe() succeeds.
 * Fire-and-forget — the caller should NOT await this.
 *
 * Flow:
 *  1. Fetch all userChallenge docs for this user (the challenges they've joined).
 *  2. Fetch each corresponding challenge definition.
 *  3. For each active, qualifying challenge, record a contribution.
 *
 * @param {string} userId
 * @param {string} recipeId   - the newly created recipe's Firestore ID
 * @param {object} recipe     - the recipe payload (name, tags, ingredients, etc.)
 * @param {object} userDoc    - the user's Firestore profile (username, profileImage)
 */
export async function processChallengesOnRecipePost(userId, recipeId, recipe, userDoc) {
    // 1. Get all challenges this user has joined
    const userChallengesSnap = await getDocs(
        collection(db, 'users', userId, 'userChallenges')
    );
    if (userChallengesSnap.empty) return;

    const joined = userChallengesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // 2. Fetch challenge definitions in parallel
    const challengeDefs = await Promise.all(joined.map((uc) => getChallengeById(uc.id)));

    const now = new Date();

    // 3. Process each joined challenge
    await Promise.all(
        joined.map(async (uc, i) => {
            const challenge = challengeDefs[i];
            if (!challenge) return;

            // Check that we're within the challenge date window
            const start = challenge.startDate?.toDate?.() ?? new Date(challenge.startDate);
            const end = challenge.endDate?.toDate?.() ?? new Date(challenge.endDate);
            if (now < start || now > end) return;

            // Check that this recipe qualifies under the challenge condition
            if (!recipeMatchesCondition(recipe, challenge.condition ?? null)) return;

            // Record the contribution
            try {
                await recordChallengeContribution(
                    userId,
                    challenge.id,
                    recipeId,
                    recipe,
                    userDoc,
                    challenge.challengeType,
                    challenge.goalValue
                );
            } catch (err) {
                console.error(`Challenge tracking error for "${challenge.title}":`, err);
            }
        })
    );
}
