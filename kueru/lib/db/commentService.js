import { db } from '../firebase/config';
import { collection, doc, getDoc, query, where, orderBy, getDocs, addDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

const COMMENTS_COLLECTION = 'comments';

export const getComment = async (commentId) => {
    const snap = await getDoc(doc(db, COMMENTS_COLLECTION, commentId));
    if (!snap.exists()) { return null; }
    return { id: snap.id, ...snap.data() };
};

export const getCommentsByPost = async (postId) => {
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    // Assumes top-level comments don't have a parentCommentId, or we check where parentCommentId is null
    const q = query(
        commentsRef, 
        where('postId', '==', postId),
        where('parentCommentId', '==', null), // Requires index if using both
        orderBy('postedDateTime', 'asc')
    );
    
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createComment = async (postId, userId, content, parentCommentId = null) => {
    const commentRef = await addDoc(collection(db, COMMENTS_COLLECTION), {
        postId,
        userId,
        content,
        parentCommentId,
        postedDateTime: serverTimestamp(),
        upvotesCount: 0,
    });
    await updateDoc(doc(db, 'forum_posts', postId), {
        commentsCount: increment(1),
    });
    return commentRef.id;
};

export const getRepliesByComment = async (parentCommentId) => {
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    const q = query(
        commentsRef, 
        where('parentCommentId', '==', parentCommentId),
        orderBy('postedDateTime', 'asc')
    );
    
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
