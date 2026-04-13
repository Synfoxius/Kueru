import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit, orderBy, startAfter, serverTimestamp } from 'firebase/firestore';

const USERS_COLLECTION = 'users';
const RECIPES_COLLECTION = 'recipes';

/**
 * Fetch basic user profile. Excludes achievements/challenges.
 * @param {string} userId 
 */
export const getUser = async (userId) => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
};

/**
 * Look up a user by username
 * @param {string} username 
 */
export const getUserByUsername = async (username) => {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('username', '==', username));
    const snap = await getDocs(q);
    
    if (snap.empty) return null;
    
    const userDoc = snap.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
};

/**
 * Optimistically update basic user details on the client side.
 * @param {string} userId 
 * @param {object} partialData 
 */
export const updateUser = async (userId, partialData) => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, partialData);
};

export const getCreatedRecipes = async (userId, lastDoc = null, limitCount = 10) => {
    const createdRef = collection(db, USERS_COLLECTION, userId, 'createdRecipes');
    
    let queryConstraints = [
        orderBy('createdAt', 'desc'),
        limit(limitCount)
    ];
    
    if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
    }
    
    const q = query(createdRef, ...queryConstraints);
    const snap = await getDocs(q);
    
    const recipePromises = snap.docs.map(async (referenceDoc) => {
        const recipeId = referenceDoc.id;
        const recipeSnap = await getDoc(doc(db, RECIPES_COLLECTION, recipeId));
        return { 
            id: recipeId, 
            ...recipeSnap.data(),
            _referenceMetadata: referenceDoc.data() 
        };
    });
    
    const recipes = await Promise.all(recipePromises);
    
    return { recipes, lastDoc: snap.docs[snap.docs.length - 1] };
};

/**
 * Create a new user document in Firestore with default values.
 * Called immediately after Firebase Auth registration.
 * @param {string} uid - Firebase Auth UID
 * @param {{ email: string, username: string, profileImage?: string }} data
 */
export const createUser = async (uid, { email, username, profileImage = '' }) => {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(userRef, {
        userId: uid,
        email,
        username,
        role: 'customer',
        verified: false,
        onboarding: {
            dietaryPreferences: [],
            foodAllergies: [],
            cookingSkill: '',
            recipeInterests: [],
        },
        onboardingComplete: false,
        followingCount: 0,
        followerCount: 0,
        bio: '',
        profileImage,
        createdAt: serverTimestamp(),
        createdRecipes: [],
        savedRecipes: [],
        achievementCompleted: {},
        challengesJoined: {},
    });
};

/**
 * Save completed onboarding data and mark the user as fully registered.
 * @param {string} uid
 * @param {{ dietaryPreferences: string[], foodAllergies: string[], cookingSkill: string, recipeInterests: string[] }} onboardingData
 */
export const completeOnboarding = async (uid, onboardingData) => {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
        onboarding: onboardingData,
        onboardingComplete: true,
    });
};

export const getSavedRecipes = async (userId, lastDoc = null, limitCount = 10) => {
    const savedRef = collection(db, USERS_COLLECTION, userId, 'savedRecipes');
    
    let queryConstraints = [
        orderBy('savedAt', 'desc'),
        limit(limitCount)
    ];
    
    if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
    }
    
    const q = query(savedRef, ...queryConstraints);
    const snap = await getDocs(q);
    
    const recipePromises = snap.docs.map(async (referenceDoc) => {
        const recipeId = referenceDoc.id;
        const recipeSnap = await getDoc(doc(db, RECIPES_COLLECTION, recipeId));
        return { 
            id: recipeId, 
            ...recipeSnap.data(),
            _savedMetadata: referenceDoc.data()
        };
    });
    
    const recipes = await Promise.all(recipePromises);
    
    return { recipes, lastDoc: snap.docs[snap.docs.length - 1] };
};
