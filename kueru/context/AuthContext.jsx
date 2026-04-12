/*
Firebase App Listener - Firebase automatically checks if there is a user session
and loads the Firestore user document in real-time.
*/
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userDoc, setUserDoc] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubFirestore = () => {};

        const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
            // Cancel any existing Firestore listener from a previous session
            unsubFirestore();

            if (!firebaseUser) {
                setUser(null);
                setUserDoc(null);
                setLoading(false);
                return;
            }

            setUser(firebaseUser);

            // Real-time listener on the user's Firestore doc.
            // Using onSnapshot (not getDoc) so that when completeOnboarding writes
            // onboardingComplete: true, the context updates immediately without a
            // race condition between the write and the redirect.
            unsubFirestore = onSnapshot(
                doc(db, "users", firebaseUser.uid),
                (snap) => {
                    setUserDoc(snap.exists() ? snap.data() : null);
                    setLoading(false);
                },
                () => {
                    setUserDoc(null);
                    setLoading(false);
                }
            );
        });

        return () => {
            unsubAuth();
            unsubFirestore();
        };
    }, []);

    return (
        // onboardingComplete is exposed as a tri-state:
        //   null  = Firestore doc not yet created (mid-registration, treat as loading)
        //   false = doc exists but onboarding not done → redirect to /onboarding
        //   true  = fully registered → allow access to main app
        <AuthContext.Provider value={{
            user,
            userDoc,
            onboardingComplete: userDoc?.onboardingComplete ?? null,
            loading,
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
