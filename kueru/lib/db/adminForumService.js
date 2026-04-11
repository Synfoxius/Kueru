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
