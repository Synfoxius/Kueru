import { db } from '../firebase/config';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, startAfter } from 'firebase/firestore';

const RECIPES_COLLECTION = 'recipes';

export const getRecipe = async (recipeId) => {
    const recipeRef = doc(db, RECIPES_COLLECTION, recipeId);
    const snap = await getDoc(recipeRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
};

export const getAllRecipes = async (filters = {}, lastDoc = null, limitCount = 10) => {
    const recipesRef = collection(db, RECIPES_COLLECTION);
    
    let queryConstraints = [];
    
    // Simple filter checks (can expand with compound indexes later)
    if (filters.tags && filters.tags.length > 0) {
        queryConstraints.push(where('tags', 'array-contains-any', filters.tags));
    }
    
    queryConstraints.push(orderBy('createdAt', 'desc'));
    queryConstraints.push(limit(limitCount));
    
    if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
    }
    
    const q = query(recipesRef, ...queryConstraints);
    const snap = await getDocs(q);
    
    const recipes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { recipes, lastDoc: snap.docs[snap.docs.length - 1] };
};

export const getRecipesByUser = async (username, lastDoc = null, limitCount = 10) => {
    const recipesRef = collection(db, RECIPES_COLLECTION);
    
    let queryConstraints = [
        where('username', '==', username),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
    ];
    
    if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
    }
    
    const q = query(recipesRef, ...queryConstraints);
    const snap = await getDocs(q);
    
    const recipes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { recipes, lastDoc: snap.docs[snap.docs.length - 1] };
};
