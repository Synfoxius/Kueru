import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit, orderBy, startAfter, serverTimestamp, documentId, arrayUnion, arrayRemove } from 'firebase/firestore';

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

export const hidePost = async (userId, postId) => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, { hiddenPosts: arrayUnion(postId) });
};

export const unhidePost = async (userId, postId) => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, { hiddenPosts: arrayRemove(postId) });
};

export const savePost = async (userId, postId) => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, { savedPosts: arrayUnion(postId) });
};

export const unsavePost = async (userId, postId) => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, { savedPosts: arrayRemove(postId) });
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

    const chunkArray = (items, size) => {
        const chunks = [];
        for (let index = 0; index < items.length; index += size) {
            chunks.push(items.slice(index, index + size));
        }
        return chunks;
    };

    export const getCertifiedChefs = async (lastDoc = null, limitCount = 5) => {
        const usersRef = collection(db, USERS_COLLECTION);

        const queryConstraints = [
            where('verified', '==', true),
            orderBy('followerCount', 'desc'),
            limit(limitCount),
        ];

        if (lastDoc) {
            queryConstraints.push(startAfter(lastDoc));
        }

        const q = query(usersRef, ...queryConstraints);
        const snap = await getDocs(q);

        return {
            users: snap.docs.map((userDoc) => ({ id: userDoc.id, ...userDoc.data() })),
            lastDoc: snap.docs[snap.docs.length - 1],
        };
    };

    export const getPopularUsers = async (lastDoc = null, limitCount = 5) => {
        const usersRef = collection(db, USERS_COLLECTION);

        const queryConstraints = [
            orderBy('followerCount', 'desc'),
            limit(limitCount),
        ];

        if (lastDoc) {
            queryConstraints.push(startAfter(lastDoc));
        }

        const q = query(usersRef, ...queryConstraints);
        const snap = await getDocs(q);

        return {
            users: snap.docs.map((userDoc) => ({ id: userDoc.id, ...userDoc.data() })),
            lastDoc: snap.docs[snap.docs.length - 1],
        };
    };

    export const getUsersByIds = async (userIds = []) => {
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return new Map();
        }

        const uniqueIds = [...new Set(userIds.filter(Boolean))];
        if (uniqueIds.length === 0) {
            return new Map();
        }

        const usersRef = collection(db, USERS_COLLECTION);
        const usersById = new Map();

        const idBatches = chunkArray(uniqueIds, 10);
        const snapshots = await Promise.all(
            idBatches.map((batch) => {
                const q = query(usersRef, where(documentId(), 'in', batch));
                return getDocs(q);
            })
        );

        snapshots.forEach((snap) => {
            snap.docs.forEach((userDoc) => {
                usersById.set(userDoc.id, { id: userDoc.id, ...userDoc.data() });
            });
        });

        return usersById;
    };
/**
 * Search users by username prefix, optionally filtered by role.
 * @param {string} searchTerm
 * @param {'all'|'chef'|'customer'} role
 * @param {number} limitCount
 */
export const searchUsers = async (searchTerm = '', role = 'all', limitCount = 20) => {
    if (!searchTerm.trim()) return [];

    const usersRef = collection(db, USERS_COLLECTION);
    const term = searchTerm.toLowerCase();
    const constraints = [
        where('onboardingComplete', '==', true),
        where('username', '>=', term),
        where('username', '<=', term + '\uf8ff'),
        limit(limitCount),
    ];

    if (role !== 'all') {
        constraints.push(where('role', '==', role === 'chef' ? 'chef' : 'customer'));
    }

    const q = query(usersRef, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
