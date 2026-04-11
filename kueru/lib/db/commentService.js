import { db } from '../firebase/config';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

const COMMENTS_COLLECTION = 'comments';

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
