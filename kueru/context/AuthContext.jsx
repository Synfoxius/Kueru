/*
Firebase App Listener - Firebase automatically checks if there is a user session
and loads the Firestore user document in real-time.
*/
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userDoc, setUserDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDisabledModal, setShowDisabledModal] = useState(false);

    const handleSignOut = async () => {
        await signOut(auth);
    };

    const handleModalDismiss = async () => {
        await signOut(auth);
        setShowDisabledModal(false);
    };

    useEffect(() => {
        let unsubFirestore = () => {};

        const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
            unsubFirestore();

            if (!firebaseUser) {
                setUser(null);
                setUserDoc(null);
                setLoading(false);
                return;
            }

            setUser(firebaseUser);

            // Real-time listener on the user's Firestore doc.
            // Using onSnapshot so that onboardingComplete updates propagate immediately.
            unsubFirestore = onSnapshot(
                doc(db, "users", firebaseUser.uid),
                (snap) => {
                    const data = snap.exists() ? snap.data() : null;

                    if (data?.status === "disabled") {
                        setShowDisabledModal(true);
                        setLoading(false);
                        return;
                    }

                    setUserDoc(data);
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
        <AuthContext.Provider value={{
            user,
            userDoc,
            onboardingComplete: userDoc?.onboardingComplete ?? null,
            loading,
            handleSignOut,
        }}>
            {!loading && children}

            <Dialog open={showDisabledModal} onOpenChange={() => {}}>
                <DialogContent
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                    className="max-w-sm"
                >
                    <DialogHeader>
                        <DialogTitle>Account Disabled</DialogTitle>
                        <DialogDescription>
                            Your account has been disabled by an administrator. Please contact support if you believe this is a mistake.
                        </DialogDescription>
                    </DialogHeader>
                    <Button className="w-full mt-2" onClick={handleModalDismiss}>
                        OK, got it
                    </Button>
                </DialogContent>
            </Dialog>
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
