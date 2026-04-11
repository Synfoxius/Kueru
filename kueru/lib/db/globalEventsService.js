import { db } from '../firebase/config';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

const ACHIEVEMENTS_COLLECTION = 'achievements';
const CHALLENGES_COLLECTION = 'challenges';

/**
 * Fetch achievement metadata
 * @param {string} achievementId 
 */
export const getAchievementDef = async (achievementId) => {
    const achievementRef = doc(db, ACHIEVEMENTS_COLLECTION, achievementId);
    const snap = await getDoc(achievementRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
};

/**
 * Pull all active platform achievements
 */
export const getAllAchievementDefs = async () => {
    const achievementsRef = collection(db, ACHIEVEMENTS_COLLECTION);
    const snap = await getDocs(achievementsRef);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Fetch ongoing active challenges
 */
export const getActiveChallenges = async () => {
    const challengesRef = collection(db, CHALLENGES_COLLECTION);
    const q = query(challengesRef, where('status', '==', 'active'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
