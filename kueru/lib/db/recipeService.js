import { db } from '../firebase/config';
import { arrayUnion, arrayRemove, collection, collectionGroup, doc, documentId, getDoc, getDocs, query, where, orderBy, limit, startAfter, serverTimestamp, writeBatch, updateDoc } from 'firebase/firestore';
import { getUsersByIds } from './userService';
import { getFollowing } from './followService';

const RECIPES_COLLECTION = 'recipes';
const DEFAULT_SORT_FIELD = 'createdAt';
const DEFAULT_SORT_DIRECTION = 'desc';
const MAX_QUERY_ROUNDS = 12;
const METADATA_SCAN_LIMIT = 1000;
const METADATA_BATCH_SIZE = 200;

const SORT_FIELD_MAP = {
    createdAt: 'createdAt',
    upvotes: 'upvotes',
    time: 'time',
    servings: 'servings',
};

const parseNumericFilter = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
};

const normalizeStringArray = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }

    return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
};

const normalizeLowercaseSet = (items) => {
    return new Set(normalizeStringArray(items).map((item) => item.toLowerCase()));
};

const isValidIngredientValue = (value) => {
    return Array.isArray(value) && value.length === 2 && Number.isFinite(Number(value[0])) && Number(value[0]) > 0 && String(value[1] ?? '').trim();
};

const normalizeIngredientObject = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    return Object.entries(value).reduce((accumulator, [name, amountAndUnit]) => {
        const normalizedName = String(name ?? '').trim();
        if (!normalizedName || !isValidIngredientValue(amountAndUnit)) {
            return accumulator;
        }

        accumulator[normalizedName] = [Number(amountAndUnit[0]), String(amountAndUnit[1]).trim()];
        return accumulator;
    }, {});
};

const normalizeStepArray = (value, normalizedIngredients) => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((step) => {
            const instruction = String(step?.instruction ?? '').trim();
            if (!instruction) {
                return null;
            }

            const stepIngredients = normalizeIngredientObject(step?.ingredients);
            const boundedIngredients = Object.keys(stepIngredients).reduce((accumulator, ingredientName) => {
                if (normalizedIngredients[ingredientName]) {
                    accumulator[ingredientName] = normalizedIngredients[ingredientName];
                }
                return accumulator;
            }, {});

            return {
                instruction,
                ingredients: boundedIngredients,
            };
        })
        .filter(Boolean);
};

const normalizeFilters = (filters = {}) => {
    const searchTerm = String(filters.searchTerm ?? filters.search ?? '').trim();
    const tags = normalizeStringArray(filters.tags);
    const onboardingDietaryPreferences = normalizeStringArray(filters.onboardingDietaryPreferences);
    const onboardingRecipeInterests = normalizeStringArray(filters.onboardingRecipeInterests);
    const onboardingExcludedAllergies = normalizeStringArray(filters.onboardingExcludedAllergies);

    const sortField = SORT_FIELD_MAP[filters.sortField] ? filters.sortField : DEFAULT_SORT_FIELD;
    const sortDirection = String(filters.sortDirection ?? filters.sortOrder ?? DEFAULT_SORT_DIRECTION).toLowerCase() === 'asc'
        ? 'asc'
        : 'desc';

    const verification = ['include_all', 'verified_only', 'verified_excluded'].includes(filters.verification)
        ? filters.verification
        : 'include_all';

    return {
        searchTerm,
        tags,
        onboardingDietaryPreferences,
        onboardingRecipeInterests,
        onboardingExcludedAllergies,
        minTime: parseNumericFilter(filters.minTime ?? filters.timeMin),
        maxTime: parseNumericFilter(filters.maxTime ?? filters.timeMax),
        minServings: parseNumericFilter(filters.minServings),
        maxServings: parseNumericFilter(filters.maxServings),
        servingsExact: parseNumericFilter(filters.servings ?? filters.servingsExact),
        sortField,
        sortDirection,
        verification,
        followedByUserId: filters.followedByUserId || null,
    };
};

const getComparableValue = (recipe, sortField) => {
    const fieldPath = SORT_FIELD_MAP[sortField] ?? DEFAULT_SORT_FIELD;
    const value = recipe[fieldPath];

    if (fieldPath === 'createdAt') {
        if (value?.toDate) {
            return value.toDate().getTime();
        }
        if (value?.seconds) {
            return value.seconds * 1000;
        }
        if (typeof value === 'number') {
            return value;
        }
        return null;
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
};

const sortRecipes = (recipes, sortField, sortDirection) => {
    const sorted = [...recipes];
    sorted.sort((leftRecipe, rightRecipe) => {
        const leftValue = getComparableValue(leftRecipe, sortField);
        const rightValue = getComparableValue(rightRecipe, sortField);

        if (leftValue === rightValue) {
            return leftRecipe.id.localeCompare(rightRecipe.id);
        }
        if (leftValue === null) {
            return 1;
        }
        if (rightValue === null) {
            return -1;
        }

        return sortDirection === 'asc' ? leftValue - rightValue : rightValue - leftValue;
    });

    return sorted;
};

/**
 * Get all recipes upvoted by a user using a collection group query.
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export const getUpvotedRecipes = async (userId) => {
    const q = query(
        collectionGroup(db, 'votes'),
        where('userId', '==', userId),
        where('value', '==', 1)
    );
    const snap = await getDocs(q);
    const recipeIds = [...new Set(snap.docs.map(d => d.ref.parent.parent.id).filter(Boolean))];
    const recipeSnaps = await Promise.all(recipeIds.map(id => getDoc(doc(db, RECIPES_COLLECTION, id))));
    return recipeSnaps.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() }));
};

const buildBaseQueryConstraints = (filters, pageLimit, lastDoc) => {
    const sortFieldPath = SORT_FIELD_MAP[filters.sortField] ?? DEFAULT_SORT_FIELD;
    const queryConstraints = [];

    if (filters.tags.length === 1) {
        queryConstraints.push(where('tags', 'array-contains', filters.tags[0]));
    } else if (filters.tags.length > 1) {
        queryConstraints.push(where('tags', 'array-contains-any', filters.tags.slice(0, 10)));
    }

    // Apply range filters at query-time only when they match the sort field.
    if (sortFieldPath === 'time') {
        if (filters.minTime !== null) {
            queryConstraints.push(where('time', '>=', filters.minTime));
        }
        if (filters.maxTime !== null) {
            queryConstraints.push(where('time', '<=', filters.maxTime));
        }
    }

    if (sortFieldPath === 'servings') {
        if (filters.minServings !== null) {
            queryConstraints.push(where('servings', '>=', filters.minServings));
        }
        if (filters.maxServings !== null) {
            queryConstraints.push(where('servings', '<=', filters.maxServings));
        }
    }

    queryConstraints.push(orderBy(sortFieldPath, filters.sortDirection));
    queryConstraints.push(limit(pageLimit));

    if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
    }

    return queryConstraints;
};

const recipeMatchesFilters = (recipe, filters, usersById) => {
    if (recipe.status && recipe.status !== 'available' && recipe.status !== 'Reported' && recipe.status !== 'reported') {
        return false;
    }

    const normalizedSearch = filters.searchTerm.toLowerCase();
    if (normalizedSearch) {
        const searchableText = `${recipe.name ?? ''} ${recipe.description ?? ''}`.toLowerCase();
        if (!searchableText.includes(normalizedSearch)) {
            return false;
        }
    }

    if (filters.tags.length > 0) {
        const recipeTags = Array.isArray(recipe.tags) ? recipe.tags : [];
        const hasAllTags = filters.tags.every((tag) => recipeTags.includes(tag));
        if (!hasAllTags) {
            return false;
        }
    }

    const onboardingTagSelections = [
        ...filters.onboardingDietaryPreferences,
        ...filters.onboardingRecipeInterests,
    ];
    if (onboardingTagSelections.length > 0) {
        const recipeTagSet = normalizeLowercaseSet(recipe.tags);
        const selectedOnboardingTagSet = normalizeLowercaseSet(onboardingTagSelections);
        const hasAnyMatchingOnboardingTag = [...selectedOnboardingTagSet].some((tag) => recipeTagSet.has(tag));

        if (!hasAnyMatchingOnboardingTag) {
            return false;
        }
    }

    if (filters.onboardingExcludedAllergies.length > 0) {
        const recipeIngredientSet = normalizeLowercaseSet(Object.keys(recipe.ingredients ?? {}));
        const excludedAllergySet = normalizeLowercaseSet(filters.onboardingExcludedAllergies);
        const containsExcludedAllergy = [...excludedAllergySet].some((allergy) => recipeIngredientSet.has(allergy));

        if (containsExcludedAllergy) {
            return false;
        }
    }

    const recipeTime = Number(recipe.time);
    if (filters.minTime !== null && (!Number.isFinite(recipeTime) || recipeTime < filters.minTime)) {
        return false;
    }
    if (filters.maxTime !== null && (!Number.isFinite(recipeTime) || recipeTime > filters.maxTime)) {
        return false;
    }

    const recipeServings = Number(recipe.servings);
    if (filters.servingsExact !== null && (!Number.isFinite(recipeServings) || recipeServings !== filters.servingsExact)) {
        return false;
    }
    if (filters.minServings !== null && (!Number.isFinite(recipeServings) || recipeServings < filters.minServings)) {
        return false;
    }
    if (filters.maxServings !== null && (!Number.isFinite(recipeServings) || recipeServings > filters.maxServings)) {
        return false;
    }

    if (filters.verification !== 'include_all') {
        const authorId = recipe.userId;
        const isVerified = usersById.get(authorId)?.verified === true;

        if (filters.verification === 'verified_only' && !isVerified) {
            return false;
        }

        if (filters.verification === 'verified_excluded' && isVerified) {
            return false;
        }
    }

    if (filters.followedUserIds) {
        if (!filters.followedUserIds.has(recipe.userId)) {
            return false;
        }
    }

    return true;
};

const scanRecipesForMetadata = async () => {
    const recipesRef = collection(db, RECIPES_COLLECTION);
    const docs = [];
    let cursor = null;

    while (docs.length < METADATA_SCAN_LIMIT) {
        const queryConstraints = [orderBy('createdAt', 'desc'), limit(METADATA_BATCH_SIZE)];
        if (cursor) {
            queryConstraints.push(startAfter(cursor));
        }

        const q = query(recipesRef, ...queryConstraints);
        const snap = await getDocs(q);
        if (snap.empty) {
            break;
        }

        docs.push(...snap.docs);
        cursor = snap.docs[snap.docs.length - 1];

        if (snap.docs.length < METADATA_BATCH_SIZE) {
            break;
        }
    }

    return docs;
};

export const getRecipe = async (recipeId) => {
    const recipeRef = doc(db, RECIPES_COLLECTION, recipeId);
    const snap = await getDoc(recipeRef);
    if (!snap.exists()) return null;

    const recipe = { id: snap.id, ...snap.data() };
    if (!recipe.userId) {
        return recipe;
    }

    try {
        const usersById = await getUsersByIds([recipe.userId]);
        const author = usersById.get(recipe.userId);
        if (author?.username) {
            recipe.username = author.username;
        }
    } catch {
        // Keep the recipe readable even if user enrichment fails.
    }

    return recipe;
};

export const createRecipe = async (recipeData = {}) => {
    const userId = String(recipeData.userId ?? '').trim();
    const name = String(recipeData.name ?? '').trim();
    const description = String(recipeData.description ?? '').trim();
    const time = Number(recipeData.time);
    const servings = Number(recipeData.servings);

    const images = Array.isArray(recipeData.images)
        ? recipeData.images
            .map((item) => {
                // Accept both plain URL strings and { url, type } objects
                if (typeof item === 'string') return { url: item.trim(), type: 'image' };
                const url = String(item?.url ?? '').trim();
                const type = item?.type === 'video' ? 'video' : 'image';
                return url ? { url, type } : null;
            })
            .filter(Boolean)
        : [];
    const tags = normalizeStringArray(recipeData.tags);
    const ingredients = normalizeIngredientObject(recipeData.ingredients);
    const steps = normalizeStepArray(recipeData.steps, ingredients);

    if (!userId) {
        throw new Error('Missing user ID.');
    }
    if (!name) {
        throw new Error('Recipe name is required.');
    }
    if (!description) {
        throw new Error('Recipe description is required.');
    }
    if (!Number.isFinite(time) || time <= 0) {
        throw new Error('Cook time must be a positive number.');
    }
    if (!Number.isFinite(servings) || servings <= 0) {
        throw new Error('Servings must be a positive number.');
    }
    if (images.length < 1) {
        throw new Error('At least one media item is required.');
    }
    if (Object.keys(ingredients).length < 1) {
        throw new Error('At least one valid ingredient is required.');
    }
    if (steps.length < 1) {
        throw new Error('At least one step instruction is required.');
    }

    const recipesRef = collection(db, RECIPES_COLLECTION);
    const recipeRef = doc(recipesRef);
    const userRef = doc(db, 'users', userId);
    const userRecipeRef = doc(db, 'users', userId, 'createdRecipes', recipeRef.id);
    const batch = writeBatch(db);

    batch.set(recipeRef, {
        userId,
        name,
        description,
        time,
        servings,
        images,
        tags,
        ingredients,
        steps,
        challengeId: recipeData.challengeId ?? null,
        upvotes: 0,
        saved: 0,
        status: 'available',
        createdAt: serverTimestamp(),
    });

    batch.set(userRecipeRef, {
        createdAt: serverTimestamp(),
    });

    await batch.commit();
    return { recipeId: recipeRef.id };
};

export const updateRecipe = async (recipeId, recipeData = {}) => {
    if (!recipeId) {
        throw new Error('Recipe ID is required.');
    }

    const name = String(recipeData.name ?? '').trim();
    const description = String(recipeData.description ?? '').trim();
    const time = Number(recipeData.time);
    const servings = Number(recipeData.servings);

    const images = Array.isArray(recipeData.images)
        ? recipeData.images
            .map((item) => {
                if (typeof item === 'string') return { url: item.trim(), type: 'image' };
                const url = String(item?.url ?? '').trim();
                const type = item?.type === 'video' ? 'video' : 'image';
                return url ? { url, type } : null;
            })
            .filter(Boolean)
        : [];
    const tags = normalizeStringArray(recipeData.tags);
    const ingredients = normalizeIngredientObject(recipeData.ingredients);
    const steps = normalizeStepArray(recipeData.steps, ingredients);

    if (!name) throw new Error('Recipe name is required.');
    if (!description) throw new Error('Recipe description is required.');
    if (!Number.isFinite(time) || time <= 0) throw new Error('Cook time must be a positive number.');
    if (!Number.isFinite(servings) || servings <= 0) throw new Error('Servings must be a positive number.');
    if (images.length < 1) throw new Error('At least one media item is required.');
    if (Object.keys(ingredients).length < 1) throw new Error('At least one valid ingredient is required.');
    if (steps.length < 1) throw new Error('At least one step instruction is required.');

    const recipeRef = doc(db, RECIPES_COLLECTION, recipeId);

    await updateDoc(recipeRef, {
        name,
        description,
        time,
        servings,
        images,
        tags,
        ingredients,
        steps,
        challengeId: recipeData.challengeId ?? null,
    });
};

export const getAllRecipes = async (filters = {}, lastDoc = null, limitCount = 10) => {
    const recipesRef = collection(db, RECIPES_COLLECTION);
    const normalizedFilters = normalizeFilters(filters);
    const targetCount = Math.max(1, limitCount);
    const pageLimit = Math.max(targetCount * 3, 20);

    if (normalizedFilters.followedByUserId) {
        const follows = await getFollowing(normalizedFilters.followedByUserId);
        normalizedFilters.followedUserIds = new Set(follows.map((f) => f.followingId));
    }

    const collectedRecipes = [];
    let cursor = lastDoc;
    let resultingLastDoc;
    let rounds = 0;

    while (collectedRecipes.length < targetCount && rounds < MAX_QUERY_ROUNDS) {
        const queryConstraints = buildBaseQueryConstraints(normalizedFilters, pageLimit, cursor);
        const q = query(recipesRef, ...queryConstraints);
        const snap = await getDocs(q);

        if (snap.empty) {
            break;
        }
        rounds += 1;

        const batchItems = snap.docs.map((recipeDoc) => ({
            doc: recipeDoc,
            recipe: { id: recipeDoc.id, ...recipeDoc.data() },
        }));
        const authorIds = batchItems.map((item) => item.recipe.userId).filter(Boolean);
        const usersById = await getUsersByIds(authorIds);

        let reachedTargetCount = false;

        for (const item of batchItems) {
            resultingLastDoc = item.doc;

            // Enrich recipe with username for UI components
            const author = usersById.get(item.recipe.userId);
            if (author?.username) {
                item.recipe.username = author.username;
            }

            if (recipeMatchesFilters(item.recipe, normalizedFilters, usersById)) {
                collectedRecipes.push(item.recipe);
            }

            if (collectedRecipes.length >= targetCount) {
                reachedTargetCount = true;
                break;
            }
        }

        cursor = resultingLastDoc;

        if (reachedTargetCount) {
            break;
        }

        if (snap.docs.length < pageLimit) {
            break;
        }
    }

    const sortedRecipes = sortRecipes(collectedRecipes, normalizedFilters.sortField, normalizedFilters.sortDirection);
    return { recipes: sortedRecipes.slice(0, targetCount), lastDoc: resultingLastDoc };
};

export const getRecipesByUser = async (userId, lastDoc = null, limitCount = 10) => {
    const recipesRef = collection(db, RECIPES_COLLECTION);

    let queryConstraints = [
        where('userId', '==', userId),
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

export const getTopChefRecipes = async (limitCount = 5) => {
    const { recipes } = await getAllRecipes(
        {
            verification: 'verified_only',
            sortField: 'upvotes',
            sortDirection: 'desc',
        },
        null,
        limitCount
    );

    return recipes;
};

export const getTopUserRecipes = async (limitCount = 5) => {
    const { recipes } = await getAllRecipes(
        {
            verification: 'verified_excluded',
            sortField: 'upvotes',
            sortDirection: 'desc',
        },
        null,
        limitCount
    );

    return recipes;
};

export const getAvailableRecipeTags = async () => {
    const docs = await scanRecipesForMetadata();
    const tagSet = new Set();

    docs.forEach((recipeDoc) => {
        const tags = recipeDoc.data().tags;
        if (Array.isArray(tags)) {
            tags.forEach((tag) => {
                if (tag) {
                    tagSet.add(tag);
                }
            });
        }
    });

    return [...tagSet].sort((leftTag, rightTag) => leftTag.localeCompare(rightTag));
};

export const getMaxRecipeCookTime = async () => {
    const recipesRef = collection(db, RECIPES_COLLECTION);
    const q = query(recipesRef, orderBy('time', 'desc'), limit(1));
    const snap = await getDocs(q);

    if (snap.empty) {
        return 240;
    }

    const maxTime = snap.docs[0].data().time;
    return Number.isFinite(Number(maxTime)) && Number(maxTime) > 0 ? Number(maxTime) : 240;
};

export const deleteRecipe = async (recipeId) => {
    if (!recipeId) throw new Error('Recipe ID is required.');

    const recipeRef = doc(db, RECIPES_COLLECTION, recipeId);
    const snap = await getDoc(recipeRef);

    if (!snap.exists()) return;

    const recipeData = snap.data();
    const userId = recipeData.userId;

    if (userId) {
        const userCreatedRef = doc(db, 'users', userId, 'createdRecipes', recipeId);
        const userSavedRef = doc(db, 'users', userId, 'savedRecipes', recipeId);
        const batch = writeBatch(db);

        batch.update(recipeRef, { status: 'deleted' });
        batch.delete(userCreatedRef);
        batch.delete(userSavedRef);

        await batch.commit();
    } else {
        await updateDoc(recipeRef, { status: 'deleted' });
    }
};
