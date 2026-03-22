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
    signInWithEmailAndPassword(auth, email, password);
}
    

// Google login
export const loginWithGoogle = () => {
    signInWithPopup(auth, googleProvider);
}

// Register new user
export const registerWithEmail = (email, password) => {
    createUserWithEmailAndPassword(auth, email, password);
}

// Logout
export const logout = () => {
    signOut(auth);
}

// Forgot password
export const resetPassword = (email) => {
    sendPasswordResetEmail(auth, email);
}