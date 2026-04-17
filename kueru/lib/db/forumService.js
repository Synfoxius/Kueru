import { db } from '../firebase/config';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter, serverTimestamp, documentId } from 'firebase/firestore';

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

export const deletePost = async (postId) => {
    await deleteDoc(doc(db, FORUM_COLLECTION, postId));
};

export const updatePost = async (postId, content) => {
    await updateDoc(doc(db, FORUM_COLLECTION, postId), {
        content,
        editedDateTime: serverTimestamp(),
    });
};

export const getPostsByIds = async (postIds) => {
    if (!postIds?.length) { return []; }
    const chunks = [];
    for (let i = 0; i < postIds.length; i += 30) {
        chunks.push(postIds.slice(i, i + 30));
    }
    const results = await Promise.all(
        chunks.map((chunk) =>
            getDocs(query(collection(db, FORUM_COLLECTION), where(documentId(), "in", chunk)))
        )
    );
    return results.flatMap((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() })));
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
