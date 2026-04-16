import admin from 'firebase-admin';
import { adminDB } from '../firebase/backend_config';

const RECIPES_COLLECTION = 'recipes';

export const createRecipe = async (recipeData) => {
    const creatorId = recipeData.userId; // Schema specified "userId" field holds the user ID
    
    // Pre-generate a doc ref ID
    const newRecipeRef = adminDB.collection(RECIPES_COLLECTION).doc();
    const batch = adminDB.batch();

    // 1. Create main recipe
    batch.set(newRecipeRef, {
        ...recipeData,
        upvotes: 0,
        saved: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Add reference to user's createdRecipes subcollection
    if (creatorId) {
        const userCreatedRef = adminDB
            .collection('users')
            .doc(creatorId)
            .collection('createdRecipes')
            .doc(newRecipeRef.id);
            
        batch.set(userCreatedRef, { 
            createdAt: admin.firestore.FieldValue.serverTimestamp() 
        });
    }

    await batch.commit();
    return { recipeId: newRecipeRef.id };
};

export const updateRecipe = async (recipeId, partialData) => {
    const recipeRef = adminDB.collection(RECIPES_COLLECTION).doc(recipeId);
    await recipeRef.update(partialData);
};

export const deleteRecipe = async (recipeId) => {
    // Note: Future feature to also delete associated images from Firebase Storage
    const recipeRef = adminDB.collection(RECIPES_COLLECTION).doc(recipeId);
    await recipeRef.delete();
};

export const updateRecipeUpvotes = async (recipeId, incrementAmount) => {
    const recipeRef = adminDB.collection(RECIPES_COLLECTION).doc(recipeId);
    await adminDB.runTransaction(async (transaction) => {
        const snap = await transaction.get(recipeRef);
        if (!snap.exists) throw new Error("Recipe not found.");
        
        transaction.update(recipeRef, {
            upvotes: admin.firestore.FieldValue.increment(incrementAmount)
        });
    });
};

export const saveRecipe = async (userId, recipeId) => {
    const recipeRef = adminDB.collection(RECIPES_COLLECTION).doc(recipeId);
    const userSaveRef = adminDB.collection('users').doc(userId).collection('savedRecipes').doc(recipeId);

    await adminDB.runTransaction(async (transaction) => {
        const snap = await transaction.get(recipeRef);
        const saveSnap = await transaction.get(userSaveRef);

        if (!snap.exists) throw new Error("Recipe not found.");
        if (saveSnap.exists) throw new Error("Recipe is already saved by this user.");
        
        // Add to subcollection
        transaction.set(userSaveRef, { 
            savedAt: admin.firestore.FieldValue.serverTimestamp() 
        });
        
        // Increment global counter
        transaction.update(recipeRef, {
            saved: admin.firestore.FieldValue.increment(1)
        });
    });
};

/**
 * Fetch a single recipe by ID.
 * @param {string} recipeId
 */
export const getRecipe = async (recipeId) => {
    const snap = await adminDB.collection(RECIPES_COLLECTION).doc(recipeId).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
};

/**
 * Fetch all recipes, newest first.
 */
export const getAllRecipes = async () => {
    const snap = await adminDB.collection(RECIPES_COLLECTION)
        .orderBy('createdAt', 'desc')
        .limit(200)
        .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Fetch recipes filtered by status, newest first.
 * @param {string} status - 'available' | 'pending' | 'deleted' | 'archived'
 */
export const getRecipesByStatus = async (status) => {
    const snap = await adminDB.collection(RECIPES_COLLECTION)
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .limit(200)
        .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Update the status of a recipe.
 * @param {string} recipeId
 * @param {string} status - 'available' | 'pending' | 'deleted' | 'archived'
 */
export const updateRecipeStatus = async (recipeId, status) => {
    await adminDB.collection(RECIPES_COLLECTION).doc(recipeId).update({ status });
};

export const unsaveRecipe = async (userId, recipeId) => {
    const recipeRef = adminDB.collection(RECIPES_COLLECTION).doc(recipeId);
    const userSaveRef = adminDB.collection('users').doc(userId).collection('savedRecipes').doc(recipeId);

    await adminDB.runTransaction(async (transaction) => {
        const snap = await transaction.get(recipeRef);
        const saveSnap = await transaction.get(userSaveRef);

        if (!snap.exists) throw new Error("Recipe not found.");
        if (!saveSnap.exists) throw new Error("Recipe was not saved by this user.");
        
        // Remove from subcollection
        transaction.delete(userSaveRef);
        
        // Decrement global counter
        transaction.update(recipeRef, {
            saved: admin.firestore.FieldValue.increment(-1)
        });
    });
};
