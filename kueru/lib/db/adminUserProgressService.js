import admin from 'firebase-admin';
import { adminDB } from '../firebase/backend_config';

const USERS_COLLECTION = 'users';

/**
 * Update progress for a specific achievement.
 * @param {string} userId 
 * @param {string} achievementId 
 * @param {object} data - e.g. { currentValue, status, linkedRecipeIds }
 */
export const updateUserAchievement = async (userId, achievementId, data) => {
    // Uses transactions to safely ensure we don't overwrite if achievement status updates concurrently
    await adminDB.runTransaction(async (transaction) => {
        const achievementRef = adminDB
            .collection(USERS_COLLECTION)
            .doc(userId)
            .collection('achievementCompleted')
            .doc(achievementId);
            
        const snap = await transaction.get(achievementRef);
        
        if (!snap.exists) {
            transaction.set(achievementRef, {
                ...data,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });
        } else {
            transaction.update(achievementRef, {
                ...data,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });
        }
    });
};

/**
 * Join a challenge
 * @param {string} userId 
 * @param {string} challengeId 
 */
export const joinChallenge = async (userId, challengeId) => {
    const userChallengeRef = adminDB
        .collection(USERS_COLLECTION)
        .doc(userId)
        .collection('challengesJoined')
        .doc(challengeId);

    await userChallengeRef.set({
        contribution: 0,
        completed: false,
        joinedAt: admin.firestore.FieldValue.serverTimestamp()
    });
};

/**
 * Update user's progress within a specific challenge
 * @param {string} userId 
 * @param {string} challengeId 
 * @param {number} addedContribution 
 */
export const updateUserChallengeProgress = async (userId, challengeId, addedContribution) => {
    await adminDB.runTransaction(async (transaction) => {
        const userChallengeRef = adminDB
            .collection(USERS_COLLECTION)
            .doc(userId)
            .collection('challengesJoined')
            .doc(challengeId);
            
        const snap = await transaction.get(userChallengeRef);
        
        if (!snap.exists()) {
            throw new Error("User has not joined this challenge.");
        }
        
        const currentData = snap.data();
        const newContribution = (currentData.contribution || 0) + addedContribution;
        
        transaction.update(userChallengeRef, {
            contribution: newContribution
        });
    });
};
