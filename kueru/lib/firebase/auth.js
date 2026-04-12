import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "./config";

const googleProvider = new GoogleAuthProvider();

// Email & password login
export const loginWithEmail = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
}

// Google login
export const loginWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
}

// Register new user
export const registerWithEmail = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
}

// Logout
export const logout = () => {
    return signOut(auth);
}

// Forgot password
export const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
}