import admin from 'firebase-admin';
import { adminDB } from '../firebase/backend_config';

const USERS_COLLECTION = 'users';

/**
 * Create a new user profile document securely via the backend.
 * @param {string} userId - Auth generated User ID
 * @param {object} userData - Details like email, username, role
 */
export const createUser = async (userId, userData) => {
    const userRef = adminDB.collection(USERS_COLLECTION).doc(userId);
    
    await userRef.set({
        ...userData,
        followingCount: 0,
        followerCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { id: userId, ...userData };
};

/**
 * Handle saving user onboarding info. 
 * Often needs admin access to bypass strict rules or manipulate complex array/map updates.
 * @param {string} userId
 * @param {object} onboardingData - { dietaryPreferences, foodAllergies, cookingSkill, recipeInterests }
 */
export const updateUserOnboarding = async (userId, onboardingData) => {
    const userRef = adminDB.collection(USERS_COLLECTION).doc(userId);
    
    await userRef.update({
        onboarding: onboardingData
    });
};

/**
 * Delete a user profile.
 * Note: A real app might also trigger functions to clean up recipes, follows, or comments here.
 * @param {string} userId
 */
export const deleteUser = async (userId) => {
    const userRef = adminDB.collection(USERS_COLLECTION).doc(userId);
    await userRef.delete();
};
