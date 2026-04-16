import admin from 'firebase-admin';
import { adminDB } from '../firebase/backend_config';

const FORUM_COLLECTION = 'forum_posts';

export const createPost = async (postData) => {
    const docRef = await adminDB.collection(FORUM_COLLECTION).add({
        ...postData,
        postedDateTime: admin.firestore.FieldValue.serverTimestamp(),
        editedDateTime: admin.firestore.FieldValue.serverTimestamp(),
        upvotesCount: 0,
        commentsCount: 0
    });
    return { postId: docRef.id };
};

export const updatePost = async (postId, partialData) => {
    const postRef = adminDB.collection(FORUM_COLLECTION).doc(postId);
    await postRef.update({
        ...partialData,
        editedDateTime: admin.firestore.FieldValue.serverTimestamp()
    });
};

export const deletePost = async (postId) => {
    const postRef = adminDB.collection(FORUM_COLLECTION).doc(postId);
    await postRef.delete();
};

export const updatePostUpvotes = async (postId, incrementAmount) => {
    const postRef = adminDB.collection(FORUM_COLLECTION).doc(postId);
    await adminDB.runTransaction(async (transaction) => {
        const snap = await transaction.get(postRef);
        if (!snap.exists) throw new Error("Post not found.");
        
        transaction.update(postRef, {
            upvotesCount: admin.firestore.FieldValue.increment(incrementAmount)
        });
    });
};

/**
 * Fetch a single forum post by ID.
 * @param {string} postId
 */
export const getPost = async (postId) => {
    const snap = await adminDB.collection(FORUM_COLLECTION).doc(postId).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
};

/**
 * Fetch all forum posts, newest first.
 */
export const getAllPosts = async () => {
    const snap = await adminDB.collection(FORUM_COLLECTION)
        .orderBy('postedDateTime', 'desc')
        .limit(200)
        .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Fetch forum posts filtered by status, newest first.
 * @param {string} status - 'available' | 'pending' | 'deleted' | 'archived'
 */
export const getPostsByStatus = async (status) => {
    const snap = await adminDB.collection(FORUM_COLLECTION)
        .where('status', '==', status)
        .orderBy('postedDateTime', 'desc')
        .limit(200)
        .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Update the status of a forum post.
 * @param {string} postId
 * @param {string} status - 'available' | 'pending' | 'deleted' | 'archived'
 */
export const updatePostStatus = async (postId, status) => {
    await adminDB.collection(FORUM_COLLECTION).doc(postId).update({ status });
};

export const updatePostCommentCount = async (postId, incrementAmount) => {
    const postRef = adminDB.collection(FORUM_COLLECTION).doc(postId);
    await adminDB.runTransaction(async (transaction) => {
        const snap = await transaction.get(postRef);
        if (!snap.exists) throw new Error("Post not found.");
        
        transaction.update(postRef, {
            commentsCount: admin.firestore.FieldValue.increment(incrementAmount)
        });
    });
};
