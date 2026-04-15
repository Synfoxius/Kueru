import { db } from '../firebase/config';
import {
    collection, doc, addDoc, updateDoc, getDocs, writeBatch,
    query, where, orderBy, limit, startAfter, onSnapshot, serverTimestamp,
} from 'firebase/firestore';

const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Create a notification. No-ops silently if recipient === sender.
 * @param {string} recipientId
 * @param {string|null} senderId
 * @param {'follow'|'post_upvote'|'comment_upvote'|'comment'|'verification_approved'|'verification_rejected'} type
 * @param {string|null} targetId
 */
export const createNotification = async (recipientId, senderId, type, targetId = null) => {
    if (!recipientId) return;
    if (senderId && recipientId === senderId) return; // never notify yourself

    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
        recipientId,
        senderId: senderId ?? null,
        type,
        targetId: targetId ?? null,
        read: false,
        createdAt: serverTimestamp(),
    });
};

const PAGE_SIZE = 20;

/**
 * Fetch a page of notifications for a user, newest first.
 * Returns { notifications, lastDoc, hasMore }.
 * @param {string} userId
 * @param {import('firebase/firestore').QueryDocumentSnapshot|null} cursor - pass lastDoc from previous page for pagination
 */
export const getNotifications = async (userId, cursor = null) => {
    const constraints = [
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE + 1), // fetch one extra to detect if more exist
    ];
    if (cursor) constraints.push(startAfter(cursor));

    const snap = await getDocs(query(collection(db, NOTIFICATIONS_COLLECTION), ...constraints));
    const hasMore = snap.docs.length > PAGE_SIZE;
    const docs = hasMore ? snap.docs.slice(0, PAGE_SIZE) : snap.docs;
    return {
        notifications: docs.map(d => ({ id: d.id, ...d.data() })),
        lastDoc: docs[docs.length - 1] ?? null,
        hasMore,
    };
};

/**
 * Mark a single notification as read.
 * @param {string} notificationId
 */
export const markNotificationRead = async (notificationId) => {
    await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), { read: true });
};

/**
 * Mark all unread notifications for a user as read.
 * @param {string} userId
 */
export const markAllRead = async (userId) => {
    const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('recipientId', '==', userId),
        where('read', '==', false)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
};

/**
 * Subscribe to the unread notification count for a user.
 * Returns an unsubscribe function.
 * @param {string} userId
 * @param {(count: number) => void} callback
 */
export const subscribeUnreadCount = (userId, callback) => {
    const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('recipientId', '==', userId),
        where('read', '==', false)
    );
    return onSnapshot(q, (snap) => callback(snap.size), () => callback(0));
};
