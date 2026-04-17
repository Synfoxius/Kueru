import { db } from '../firebase/config';
import {
    arrayUnion,
    collection,
    collectionGroup,
    doc,
    getDoc,
    getDocs,
    increment,
    limit,
    orderBy,
    query,
    setDoc,
    startAfter,
    updateDoc,
    where,
    serverTimestamp,
} from 'firebase/firestore';
import { getUser } from './userService';

const CHALLENGES_COLLECTION = 'challenges';
const USER_CHALLENGES_SUBCOLLECTION = 'userChallenges';
const CHALLENGE_POSTS_SUBCOLLECTION = 'challengePosts';
const PAGE_SIZE = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Maps an iconName string to a tabler-icon component name.
 * Used by UI components to resolve the correct icon.
 * Exported so the list and detail pages can share the same mapping.
 */
export const ICON_NAME_MAP = {
    heart:       'IconHeart',
    world:       'IconWorld',
    bolt:        'IconBolt',
    flame:       'IconFlame',
    star:        'IconStar',
    trophy:      'IconTrophy',
    leaf:        'IconLeaf',
    clock:       'IconClock',
    chef:        'IconChefHat',
    salad:       'IconSalad',
    egg:         'IconEgg',
};

// ── Read operations ───────────────────────────────────────────────────────────

/**
 * Fetches all challenge definitions ordered by endDate ascending
 * (soonest-ending first, so active challenges surface naturally).
 */
export const getAllChallenges = async () => {
    const q = query(collection(db, CHALLENGES_COLLECTION), orderBy('endDate', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Fetches a single challenge definition by Firestore document ID.
 * Returns null if the document does not exist.
 */
export const getChallengeById = async (challengeId) => {
    const snap = await getDoc(doc(db, CHALLENGES_COLLECTION, challengeId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
};

/**
 * Fetches all userChallenge docs for a given user.
 * Each doc is keyed by challengeId (the document ID) and includes a `challengeId` field
 * for collection group query compatibility.
 */
export const getUserChallenges = async (userId) => {
    const snap = await getDocs(collection(db, 'users', userId, USER_CHALLENGES_SUBCOLLECTION));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Fetches a single userChallenge doc for a specific user + challenge pair.
 * Returns null if the user has not joined this challenge.
 */
export const getUserChallenge = async (userId, challengeId) => {
    const snap = await getDoc(doc(db, 'users', userId, USER_CHALLENGES_SUBCOLLECTION, challengeId));
    if (!snap.exists()) return null;
    return snap.data();
};

/**
 * Fetches participants for a challenge using a collection group query.
 * Returns participants sorted by contribution descending.
 *
 * Requires a Firestore composite index on:
 *   Collection group: userChallenges
 *   Fields: challengeId ASC, contribution DESC
 *
 * For each participant, fetches their user profile in parallel.
 *
 * @param {string} challengeId
 * @param {import('firebase/firestore').QueryDocumentSnapshot | null} lastDoc - for pagination
 * @returns {{ participants: Array, lastDoc: any, hasMore: boolean }}
 */
export const getParticipants = async (challengeId, lastDoc = null) => {
    let q = query(
        collectionGroup(db, USER_CHALLENGES_SUBCOLLECTION),
        where('challengeId', '==', challengeId),
        orderBy('contribution', 'desc'),
        limit(PAGE_SIZE + 1)
    );
    if (lastDoc) q = query(q, startAfter(lastDoc));

    const snap = await getDocs(q);
    const hasMore = snap.docs.length > PAGE_SIZE;
    const docs = hasMore ? snap.docs.slice(0, PAGE_SIZE) : snap.docs;

    // Extract the userId from the document path: users/{userId}/userChallenges/{challengeId}
    const entries = docs.map((d) => {
        const pathParts = d.ref.path.split('/');
        const userId = pathParts[1]; // users/[userId]/userChallenges/...
        return { userId, ...d.data() };
    });

    // Fetch user profiles in parallel
    const profiles = await Promise.all(entries.map((e) => getUser(e.userId)));
    const participants = entries.map((e, i) => ({
        userId: e.userId,
        contribution: e.contribution ?? 0,
        lastRecipeName: e.lastRecipeName ?? null,
        lastRecipeId: e.lastRecipeId ?? null,
        username: profiles[i]?.username ?? 'Unknown',
        profileImage: profiles[i]?.profileImage ?? null,
    }));

    return {
        participants,
        lastDoc: hasMore ? docs[docs.length - 1] : null,
        hasMore,
    };
};

/**
 * Fetches community posts for a challenge, paginated by createdAt descending.
 *
 * @param {string} challengeId
 * @param {import('firebase/firestore').QueryDocumentSnapshot | null} lastDoc - for pagination
 * @returns {{ posts: Array, lastDoc: any, hasMore: boolean }}
 */
export const getCommunityPosts = async (challengeId, lastDoc = null) => {
    let q = query(
        collection(db, CHALLENGES_COLLECTION, challengeId, CHALLENGE_POSTS_SUBCOLLECTION),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE + 1)
    );
    if (lastDoc) q = query(q, startAfter(lastDoc));

    const snap = await getDocs(q);
    const hasMore = snap.docs.length > PAGE_SIZE;
    const docs = hasMore ? snap.docs.slice(0, PAGE_SIZE) : snap.docs;
    const posts = docs.map((d) => ({ id: d.id, ...d.data() }));

    return {
        posts,
        lastDoc: hasMore ? docs[docs.length - 1] : null,
        hasMore,
    };
};

// ── Write operations ──────────────────────────────────────────────────────────

/**
 * Joins a challenge for the given user.
 * Creates the userChallenge doc (if not already joined) and increments participantCount.
 * Returns true if newly joined, false if already joined.
 */
export const joinChallenge = async (userId, challengeId) => {
    const ucRef = doc(db, 'users', userId, USER_CHALLENGES_SUBCOLLECTION, challengeId);
    const existing = await getDoc(ucRef);
    if (existing.exists()) return false; // Already joined

    await setDoc(ucRef, {
        challengeId,
        contribution: 0,
        joinedAt: serverTimestamp(),
        completed: false,
        linkedRecipeIds: [],
        lastRecipeName: null,
        lastRecipeId: null,
    });

    await updateDoc(doc(db, CHALLENGES_COLLECTION, challengeId), {
        participantCount: increment(1),
    });

    return true;
};

/**
 * Records a recipe contribution to a challenge.
 * Called by the challenge tracking service — not directly by UI.
 *
 * Updates:
 *  - userChallenge: contribution++, linkedRecipeIds, lastRecipeName, lastRecipeId, completed
 *  - challenge: currentValue++
 *  - challengePosts subcollection: adds a post doc
 */
export const recordChallengeContribution = async (
    userId,
    challengeId,
    recipeId,
    recipe,
    userDoc,
    challengeType,
    goalValue
) => {
    const ucRef = doc(db, 'users', userId, USER_CHALLENGES_SUBCOLLECTION, challengeId);
    const challengeRef = doc(db, CHALLENGES_COLLECTION, challengeId);

    // Read current contribution to determine completion
    const ucSnap = await getDoc(ucRef);
    const currentContribution = ucSnap.exists() ? (ucSnap.data().contribution ?? 0) : 0;
    const newContribution = currentContribution + 1;

    const individualCompleted = challengeType === 'individual' && newContribution >= goalValue;

    await updateDoc(ucRef, {
        contribution: increment(1),
        linkedRecipeIds: arrayUnion(recipeId),
        lastRecipeName: recipe.name,
        lastRecipeId: recipeId,
        ...(individualCompleted ? { completed: true } : {}),
    });

    await updateDoc(challengeRef, { currentValue: increment(1) });

    // For collective challenges, check if community goal is now met
    if (challengeType === 'collective') {
        const updatedChallenge = await getDoc(challengeRef);
        if ((updatedChallenge.data()?.currentValue ?? 0) >= goalValue) {
            await updateDoc(ucRef, { completed: true });
        }
    }

    // Write to challengePosts subcollection for community posts tab
    await setDoc(
        doc(db, CHALLENGES_COLLECTION, challengeId, CHALLENGE_POSTS_SUBCOLLECTION, recipeId),
        {
            recipeId,
            userId,
            username: userDoc?.username ?? '',
            profileImage: userDoc?.profileImage ?? null,
            recipeName: recipe.name,
            imageURL: recipe.imageURL ?? null,
            upvotes: recipe.upvotes ?? 0,
            commentCount: 0,
            createdAt: serverTimestamp(),
        }
    );
};
