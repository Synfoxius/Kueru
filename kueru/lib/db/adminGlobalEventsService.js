import admin from 'firebase-admin';
import { adminDB } from '../firebase/backend_config';

const ACHIEVEMENTS_COLLECTION = 'achievements';
const CHALLENGES_COLLECTION = 'challenges';

/**
 * Admin: Create a new platform achievement definition
 * @param {object} data
 */
export const createAchievementDef = async (data) => {
    const docRef = await adminDB.collection(ACHIEVEMENTS_COLLECTION).add({
        ...data
    });
    // Store id back inside the doc if strictly following `document_id` schema
    await docRef.update({ document_id: docRef.id });
    return { achievementId: docRef.id };
};

/**
 * Admin: Create a new community challenge
 * @param {object} data 
 */
export const createChallenge = async (data) => {
    const docRef = await adminDB.collection(CHALLENGES_COLLECTION).add({
        ...data,
        currentValue: 0,
        participantCount: 0,
        status: 'active'
    });
    await docRef.update({ document_id: docRef.id });
    return { challengeId: docRef.id };
};

/**
 * Atomically update community `currentValue` natively using a Transaction.
 * @param {string} challengeId 
 * @param {number} addedContribution 
 */
export const updateGlobalChallengeProgress = async (challengeId, addedContribution) => {
    const challengeRef = adminDB.collection(CHALLENGES_COLLECTION).doc(challengeId);

    await adminDB.runTransaction(async (transaction) => {
        const snap = await transaction.get(challengeRef);
        if (!snap.exists) throw new Error("Challenge not found.");

        transaction.update(challengeRef, {
            currentValue: admin.firestore.FieldValue.increment(addedContribution)
        });
    });
};
