import admin from "firebase-admin";

const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Ensure that literal "\n" characters in the .env string are correctly parsed as newlines
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
}

export function getFirebaseAdmin() {
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // Required for Admin SDK storage access
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        })
    }
    return admin;
}

const firebaseAdmin = getFirebaseAdmin();

export const adminDB = firebaseAdmin.firestore();
export const adminAuth = firebaseAdmin.auth();
export const adminStorage = firebaseAdmin.storage();