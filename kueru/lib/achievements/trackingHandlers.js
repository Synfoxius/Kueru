import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

// Geographic cuisine tags — excludes dietary entries that also appear in CUISINE_TYPE_OPTIONS
const CUISINE_TAGS = new Set([
    "Italian", "Mexican", "Japanese", "Chinese", "Indian", "Thai",
    "French", "Mediterranean", "Korean", "Vietnamese", "American",
    "Middle Eastern", "Spanish", "Greek", "Desserts", "Baking",
    "BBQ & Grilling", "Seafood",
]);

/** Formats a Date as "YYYY-MM-DD" for streak comparisons. */
function toDateStr(date) {
    return date.toISOString().slice(0, 10);
}

/** Returns the date string for N days before the given date string. */
function subtractDays(dateStr, n) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() - n);
    return toDateStr(d);
}

/**
 * Handler for trackingType: "count"
 * Counts all recipes by this user, optionally filtered by a tag condition:
 *   - condition.type === "tag_includes"     → single tag match
 *   - condition.type === "tag_includes_any" → match any of condition.values[]
 *
 * Uses a separate Firestore query for each tag then deduplicates by recipe ID.
 */
export async function handleCount(userId, recipeId, recipe, achievement, currentProgress) {
    const recipesRef = collection(db, 'recipes');
    const { condition, goalValue } = achievement;

    let count = 0;
    let linkedRecipeIds = [];

    if (condition?.type === 'tag_includes') {
        const snap = await getDocs(
            query(recipesRef, where('userId', '==', userId), where('tags', 'array-contains', condition.value))
        );
        count = snap.size;
        linkedRecipeIds = snap.docs.map((d) => d.id);
    } else if (condition?.type === 'tag_includes_any') {
        // Run one query per tag, deduplicate results
        const snaps = await Promise.all(
            condition.values.map((tag) =>
                getDocs(query(recipesRef, where('userId', '==', userId), where('tags', 'array-contains', tag)))
            )
        );
        const seen = new Map();
        snaps.forEach((snap) => snap.docs.forEach((d) => seen.set(d.id, d.id)));
        count = seen.size;
        linkedRecipeIds = [...seen.keys()];
    } else {
        // No tag filter — count all user recipes
        const snap = await getDocs(query(recipesRef, where('userId', '==', userId)));
        count = snap.size;
        linkedRecipeIds = snap.docs.map((d) => d.id);
    }

    const newStatus = count >= goalValue ? 'completed' : 'in_progress';

    return {
        currentValue: count,
        status: newStatus,
        linkedRecipeIds,
        metadata: currentProgress?.metadata ?? {},
    };
}

/**
 * Handler for trackingType: "unique_count"
 * Counts unique cuisine tags across all user recipes.
 * Uses the CUISINE_TAGS whitelist to exclude dietary/allergen tags.
 */
export async function handleUniqueCount(userId, recipeId, recipe, achievement, currentProgress) {
    const recipesRef = collection(db, 'recipes');
    const { goalValue } = achievement;

    const snap = await getDocs(query(recipesRef, where('userId', '==', userId)));

    const uniqueCuisines = new Set();
    const linkedRecipeIds = [];

    snap.docs.forEach((d) => {
        const tags = d.data().tags ?? [];
        const cuisinesInRecipe = tags.filter((t) => CUISINE_TAGS.has(t));
        if (cuisinesInRecipe.length > 0) {
            cuisinesInRecipe.forEach((c) => uniqueCuisines.add(c));
            linkedRecipeIds.push(d.id);
        }
    });

    const count = uniqueCuisines.size;
    const newStatus = count >= goalValue ? 'completed' : 'in_progress';

    return {
        currentValue: count,
        status: newStatus,
        linkedRecipeIds,
        metadata: {
            ...(currentProgress?.metadata ?? {}),
            uniqueValues: [...uniqueCuisines],
        },
    };
}

/**
 * Handler for trackingType: "exact_match"
 * Checks if the current recipe has exactly goalValue ingredients.
 * One-shot: only this recipe matters; historical recipes are ignored.
 */
export async function handleExactMatch(userId, recipeId, recipe, achievement, currentProgress) {
    const { goalValue } = achievement;
    const ingredientCount = Object.keys(recipe.ingredients ?? {}).length;

    if (ingredientCount !== goalValue) return null;

    return {
        currentValue: 1,
        status: 'completed',
        linkedRecipeIds: [recipeId],
        metadata: currentProgress?.metadata ?? {},
    };
}

/**
 * Handler for trackingType: "streak"
 * Tracks consecutive days with at least one recipe posted.
 * Increments the streak if today is exactly one day after the last action date.
 * Resets to 1 if the streak was broken, or skips if already posted today.
 */
export async function handleStreak(userId, recipeId, recipe, achievement, currentProgress) {
    const { goalValue } = achievement;
    const today = toDateStr(new Date());
    const lastActionDate = currentProgress?.metadata?.lastActionDate ?? null;

    let newStreak;
    if (!lastActionDate) {
        newStreak = 1;
    } else if (lastActionDate === today) {
        // Already posted today — no change
        return null;
    } else if (lastActionDate === subtractDays(today, 1)) {
        newStreak = (currentProgress?.currentValue ?? 0) + 1;
    } else {
        // Gap in days — reset streak
        newStreak = 1;
    }

    const existingIds = currentProgress?.linkedRecipeIds ?? [];
    const linkedRecipeIds = [...existingIds, recipeId];
    const newStatus = newStreak >= goalValue ? 'completed' : 'in_progress';

    return {
        currentValue: newStreak,
        status: newStatus,
        linkedRecipeIds,
        metadata: {
            ...(currentProgress?.metadata ?? {}),
            lastActionDate: today,
        },
    };
}

/**
 * Handler for trackingType: "weekly_streak"
 * Tracks posting on consecutive Sundays.
 * Only fires when the posted recipe falls on a Sunday.
 */
export async function handleWeeklyStreak(userId, recipeId, recipe, achievement, currentProgress) {
    const { goalValue } = achievement;
    const today = new Date();

    if (today.getDay() !== 0) return null; // Not a Sunday

    const thisSunday = toDateStr(today);
    const lastSundayDate = currentProgress?.metadata?.lastSundayDate ?? null;

    let newStreak;
    if (!lastSundayDate) {
        newStreak = 1;
    } else if (lastSundayDate === thisSunday) {
        return null; // Already counted this Sunday
    } else if (lastSundayDate === subtractDays(thisSunday, 7)) {
        newStreak = (currentProgress?.currentValue ?? 0) + 1;
    } else {
        newStreak = 1; // Non-consecutive Sunday
    }

    const existingIds = currentProgress?.linkedRecipeIds ?? [];
    const linkedRecipeIds = [...existingIds, recipeId];
    const newStatus = newStreak >= goalValue ? 'completed' : 'in_progress';

    return {
        currentValue: newStreak,
        status: newStatus,
        linkedRecipeIds,
        metadata: {
            ...(currentProgress?.metadata ?? {}),
            lastSundayDate: thisSunday,
        },
    };
}
