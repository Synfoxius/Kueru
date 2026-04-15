import { db } from '../firebase/config';
import { collection, doc, getDoc, getDocs, addDoc, query, where, orderBy, limit, startAfter, serverTimestamp } from 'firebase/firestore';

const FORUM_COLLECTION = 'forum_posts';

export const getPost = async (postId) => {
    const postRef = doc(db, FORUM_COLLECTION, postId);
    const snap = await getDoc(postRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
};

export const getPostsByCategory = async (category, lastDoc = null, limitCount = 10) => {
    const postsRef = collection(db, FORUM_COLLECTION);
    
    let queryConstraints = [
        where('postCategory', '==', category),
        orderBy('postedDateTime', 'desc'),
        limit(limitCount)
    ];
    
    if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
    }
    
    const q = query(postsRef, ...queryConstraints);
    const snap = await getDocs(q);
    
    const posts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { posts, lastDoc: snap.docs[snap.docs.length - 1] };
};

export const getRecentPosts = async (lastDoc = null, limitCount = 15) => {
    const postsRef = collection(db, FORUM_COLLECTION);
    
    let queryConstraints = [
        orderBy('postedDateTime', 'desc'),
        limit(limitCount)
    ];
    
    if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
    }
    
    const q = query(postsRef, ...queryConstraints);
    const snap = await getDocs(q);
    
    const posts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { posts, lastDoc: snap.docs[snap.docs.length - 1] };
};

export const getPostsByUser = async (userId, lastDoc = null, limitCount = 10) => {
    const postsRef = collection(db, FORUM_COLLECTION);

    let queryConstraints = [
        where('userId', '==', userId),
        orderBy('postedDateTime', 'desc'),
        limit(limitCount),
    ];

    if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
    }

    const q = query(postsRef, ...queryConstraints);
    const snap = await getDocs(q);

    const posts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { posts, lastDoc: snap.docs[snap.docs.length - 1] };
};

export const createPost = async (postData) => {
    const postsRef = collection(db, FORUM_COLLECTION);
    const docRef = await addDoc(postsRef, {
        ...postData,
        postedDateTime: serverTimestamp(),
        editedDateTime: null,
        upvotesCount: 0,
        commentsCount: 0,
    });
    return docRef.id;
};
