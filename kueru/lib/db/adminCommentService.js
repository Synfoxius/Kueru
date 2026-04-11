import admin from 'firebase-admin';
import { adminDB } from '../firebase/backend_config';

const COMMENTS_COLLECTION = 'comments';
const FORUM_COLLECTION = 'forum_posts';

/**
 * Creates a comment and increments the corresponding post's commentCount
 * @param {string} postId 
 * @param {object} commentData 
 */
export const createComment = async (postId, commentData) => {
    let commentId;
    
    await adminDB.runTransaction(async (transaction) => {
        const postRef = adminDB.collection(FORUM_COLLECTION).doc(postId);
        const postSnap = await transaction.get(postRef);
        
        if (!postSnap.exists) throw new Error("Post not found.");
        
        const newCommentRef = adminDB.collection(COMMENTS_COLLECTION).doc();
        commentId = newCommentRef.id;

        // Create comment
        transaction.set(newCommentRef, {
            ...commentData,
            postId,
            postedDateTime: admin.firestore.FieldValue.serverTimestamp(),
            upvotesCount: 0
        });

        // Increment post comment count
        transaction.update(postRef, {
            commentsCount: admin.firestore.FieldValue.increment(1)
        });
    });

    return { commentId };
};

export const updateComment = async (commentId, partialData) => {
    const commentRef = adminDB.collection(COMMENTS_COLLECTION).doc(commentId);
    await commentRef.update(partialData);
};

/**
 * Deletes a comment and decrements the corresponding post's commentCount
 * @param {string} commentId 
 * @param {string} postId 
 */
export const deleteComment = async (commentId, postId) => {
    await adminDB.runTransaction(async (transaction) => {
        const commentRef = adminDB.collection(COMMENTS_COLLECTION).doc(commentId);
        const postRef = adminDB.collection(FORUM_COLLECTION).doc(postId);

        const commentSnap = await transaction.get(commentRef);
        if (commentSnap.exists) {
            transaction.delete(commentRef);
            
            // Only decrement if we actually deleted it
            transaction.update(postRef, {
                commentsCount: admin.firestore.FieldValue.increment(-1)
            });
        }
    });
};

export const updateCommentUpvotes = async (commentId, incrementAmount) => {
    const commentRef = adminDB.collection(COMMENTS_COLLECTION).doc(commentId);
    await adminDB.runTransaction(async (transaction) => {
        const snap = await transaction.get(commentRef);
        if (!snap.exists) throw new Error("Comment not found.");
        
        transaction.update(commentRef, {
            upvotesCount: admin.firestore.FieldValue.increment(incrementAmount)
        });
    });
};
