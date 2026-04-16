import { db } from "@/lib/firebase/config";
import { doc, getDoc, increment, runTransaction, serverTimestamp } from "firebase/firestore";
import { createNotification } from "@/lib/db/notificationService";

const RECIPES_COLLECTION = "recipes";
const USERS_COLLECTION = "users";

export const getRecipeInteractionState = async (userId, recipeId) => {
    if (!userId || !recipeId) {
        return { hasUpvoted: false, hasSaved: false };
    }

    const voteRef = doc(db, RECIPES_COLLECTION, recipeId, "votes", userId);
    const saveRef = doc(db, USERS_COLLECTION, userId, "savedRecipes", recipeId);

    const [voteSnap, saveSnap] = await Promise.all([getDoc(voteRef), getDoc(saveRef)]);

    return {
        hasUpvoted: voteSnap.exists() && Number(voteSnap.data()?.value ?? 0) > 0,
        hasSaved: saveSnap.exists(),
    };
};

export const toggleRecipeUpvote = async (userId, recipeId) => {
    if (!userId) {
        throw new Error("You must be logged in to vote.");
    }
    if (!recipeId) {
        throw new Error("Recipe ID is required.");
    }

    const recipeRef = doc(db, RECIPES_COLLECTION, recipeId);
    const voteRef = doc(db, RECIPES_COLLECTION, recipeId, "votes", userId);

    const result = await runTransaction(db, async (transaction) => {
        const recipeSnap = await transaction.get(recipeRef);
        if (!recipeSnap.exists()) {
            throw new Error("Recipe not found.");
        }

        const voteSnap = await transaction.get(voteRef);
        const currentVote = voteSnap.exists() ? Number(voteSnap.data()?.value ?? 0) : 0;

        let nextVote = 1;
        let incrementBy = 1;

        if (currentVote > 0) {
            nextVote = 0;
            incrementBy = -currentVote;
            transaction.delete(voteRef);
        } else {
            incrementBy = 1 - currentVote;
            transaction.set(voteRef, {
                userId,
                value: 1,
                votedAt: serverTimestamp(),
            });
        }

        transaction.update(recipeRef, {
            upvotes: increment(incrementBy),
        });

        return {
            hasUpvoted: nextVote > 0,
            upvoteDelta: incrementBy,
            authorId: recipeSnap.data()?.userId ?? null,
            recipeName: recipeSnap.data()?.name ?? null,
            wasNewUpvote: currentVote <= 0,
        };
    });

    // Fire notification outside the transaction (transactions may retry)
    if (result.hasUpvoted && result.wasNewUpvote && result.authorId) {
        await createNotification(result.authorId, userId, 'recipe_upvote', recipeId, {
            recipeName: result.recipeName,
        });
    }

    return result;
};

export const toggleRecipeSaved = async (userId, recipeId) => {
    if (!userId) {
        throw new Error("You must be logged in to save.");
    }
    if (!recipeId) {
        throw new Error("Recipe ID is required.");
    }

    const recipeRef = doc(db, RECIPES_COLLECTION, recipeId);
    const saveRef = doc(db, USERS_COLLECTION, userId, "savedRecipes", recipeId);

    return runTransaction(db, async (transaction) => {
        const recipeSnap = await transaction.get(recipeRef);
        if (!recipeSnap.exists()) {
            throw new Error("Recipe not found.");
        }

        const saveSnap = await transaction.get(saveRef);

        let hasSaved;
        let savedDelta;

        if (saveSnap.exists()) {
            hasSaved = false;
            savedDelta = -1;
            transaction.delete(saveRef);
        } else {
            hasSaved = true;
            savedDelta = 1;
            transaction.set(saveRef, {
                recipeId,
                savedAt: serverTimestamp(),
            });
        }

        transaction.update(recipeRef, {
            saved: increment(savedDelta),
        });

        return {
            hasSaved,
            savedDelta,
        };
    });
};
