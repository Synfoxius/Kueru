/*
Firebase App Listener - Firebase automatically checks if there is a user session
and loads the Firestore user document in real-time.
*/
"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const AuthContext = createContext(null);

const MODAL_CONTENT = {
    disabled: {
        title: "Account Disabled",
        description: "Your account has been disabled by an administrator. Please contact support if you believe this is a mistake.",
    },
    expired: {
        title: "Session Expired",
        description: "Your session has expired. Please log in again to continue.",
    },
};

// Minimum session duration (ms) before an unexpected logout triggers the
// "session expired" modal. Prevents the login page's admin/disabled rejection
// (which logs out almost immediately after login) from falsely triggering it.
const MIN_SESSION_MS = 3000;

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userDoc, setUserDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [logoutReason, setLogoutReason] = useState(null); // 'disabled' | 'expired' | null

    const intentionalLogout = useRef(false);
    const hadUser = useRef(false);
    const loginTime = useRef(null);

    // Call this instead of Firebase signOut directly so the "session expired"
    // modal is not triggered for intentional logouts.
    const handleSignOut = async () => {
        intentionalLogout.current = true;
        await signOut(auth);
    };

    const handleModalDismiss = async () => {
        intentionalLogout.current = true;
        if (logoutReason === "disabled") {
            await signOut(auth);
            // onAuthStateChanged will fire with null and clear user/userDoc
        }
        setLogoutReason(null);
    };

    useEffect(() => {
        let unsubFirestore = () => {};

        const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
            unsubFirestore();

            if (!firebaseUser) {
                // Unexpected logout → show "session expired" only if the user
                // was genuinely logged in long enough (avoids false positives).
                if (hadUser.current && !intentionalLogout.current) {
                    const sessionDuration = Date.now() - (loginTime.current ?? 0);
                    if (sessionDuration > MIN_SESSION_MS) {
                        setLogoutReason(prev => prev ?? "expired");
                    }
                }
                hadUser.current = false;
                intentionalLogout.current = false;
                loginTime.current = null;
                setUser(null);
                setUserDoc(null);
                setLoading(false);
                return;
            }

            hadUser.current = true;
            loginTime.current = Date.now();
            setUser(firebaseUser);

            // Real-time listener on the user's Firestore doc.
            unsubFirestore = onSnapshot(
                doc(db, "users", firebaseUser.uid),
                (snap) => {
                    const data = snap.exists() ? snap.data() : null;

                    // If admin disables the account, show modal and sign out.
                    if (data?.status === "disabled") {
                        setLogoutReason("disabled");
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

    const modalContent = logoutReason ? MODAL_CONTENT[logoutReason] : null;

    return (
        <AuthContext.Provider value={{
            user,
            userDoc,
            onboardingComplete: userDoc?.onboardingComplete ?? null,
            loading,
            handleSignOut,
        }}>
            {!loading && children}

            {/* Forced-logout modal — non-dismissible, renders above everything */}
            <Dialog open={!!modalContent} onOpenChange={() => {}}>
                {modalContent && (
                    <DialogContent
                        onInteractOutside={(e) => e.preventDefault()}
                        onEscapeKeyDown={(e) => e.preventDefault()}
                        className="max-w-sm"
                    >
                        <DialogHeader>
                            <DialogTitle>{modalContent.title}</DialogTitle>
                            <DialogDescription>{modalContent.description}</DialogDescription>
                        </DialogHeader>
                        <Button className="w-full mt-2" onClick={handleModalDismiss}>
                            OK, got it
                        </Button>
                    </DialogContent>
                )}
            </Dialog>
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
