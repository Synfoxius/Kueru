import { db } from "@/lib/firebase/config";
import { doc, getDoc, increment, runTransaction, serverTimestamp } from "firebase/firestore";

const RECIPES_COLLECTION = "recipes";
const USERS_COLLECTION = "users";

export const getRecipeInteractionState = async (userId, recipeId) => {
    if (!userId || !recipeId) {
        return { voteValue: 0, hasSaved: false };
    }

    const voteRef = doc(db, RECIPES_COLLECTION, recipeId, "votes", userId);
    const saveRef = doc(db, USERS_COLLECTION, userId, "savedRecipes", recipeId);

    const [voteSnap, saveSnap] = await Promise.all([getDoc(voteRef), getDoc(saveRef)]);

    return {
        voteValue: voteSnap.exists() ? Number(voteSnap.data()?.value ?? 0) : 0,
        hasSaved: saveSnap.exists(),
    };
};

export const setRecipeVote = async (userId, recipeId, requestedVoteValue) => {
    if (!userId) {
        throw new Error("You must be logged in to vote.");
    }
    if (!recipeId) {
        throw new Error("Recipe ID is required.");
    }

    const normalizedRequestedVote = Number(requestedVoteValue);
    if (![1, -1].includes(normalizedRequestedVote)) {
        throw new Error("Vote must be upvote or downvote.");
    }

    const recipeRef = doc(db, RECIPES_COLLECTION, recipeId);
    const voteRef = doc(db, RECIPES_COLLECTION, recipeId, "votes", userId);

    return runTransaction(db, async (transaction) => {
        const recipeSnap = await transaction.get(recipeRef);
        if (!recipeSnap.exists()) {
            throw new Error("Recipe not found.");
        }

        const voteSnap = await transaction.get(voteRef);
        const currentVote = voteSnap.exists() ? Number(voteSnap.data()?.value ?? 0) : 0;

        let nextVote = normalizedRequestedVote;
        let incrementBy = normalizedRequestedVote - currentVote;

        // Pressing the same vote again clears the vote.
        if (currentVote === normalizedRequestedVote) {
            nextVote = 0;
            incrementBy = -currentVote;
            transaction.delete(voteRef);
        } else {
            transaction.set(voteRef, {
                userId,
                value: normalizedRequestedVote,
                votedAt: serverTimestamp(),
            });
        }

        transaction.update(recipeRef, {
            upvotes: increment(incrementBy),
        });

        return {
            voteValue: nextVote,
            upvoteDelta: incrementBy,
        };
    });
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
