import { db } from '../firebase/config';
import { collection, doc, getDoc, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore';

const USERS_COLLECTION = 'users';

/**
 * Fetch all achievements for a user
 * @param {string} userId 
 */
export const getUserAchievements = async (userId, lastDoc = null, limitCount = 10) => {
    const achievementsRef = collection(db, USERS_COLLECTION, userId, 'achievementCompleted');
    
    let queryConstraints = [
        orderBy('lastUpdated', 'desc'),
        limit(limitCount)
    ];
    
    if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
    }
    
    const q = query(achievementsRef, ...queryConstraints);
    const snap = await getDocs(q);
    
    const achievements = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { achievements, lastDoc: snap.docs[snap.docs.length - 1] };
};

/**
 * Fetch single achievement status for a user
 * @param {string} userId 
 * @param {string} achievementId 
 */
export const getUserAchievement = async (userId, achievementId) => {
    const achievementRef = doc(db, USERS_COLLECTION, userId, 'achievementCompleted', achievementId);
    const snap = await getDoc(achievementRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
};

/**
 * Fetch all challenges joined by user
 * @param {string} userId 
 */
export const getUserChallenges = async (userId, lastDoc = null, limitCount = 10) => {
    const challengesRef = collection(db, USERS_COLLECTION, userId, 'challengesJoined');
    
    let queryConstraints = [
        orderBy('joinedAt', 'desc'),
        limit(limitCount)
    ];
    
    if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
    }
    
    const q = query(challengesRef, ...queryConstraints);
    const snap = await getDocs(q);
    
    const challenges = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { challenges, lastDoc: snap.docs[snap.docs.length - 1] };
};
