"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconLock } from "@tabler/icons-react";

const AUTH_ERROR_MESSAGES = {
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
};

export default function AdminLoginPage() {
    const { user, userDoc, loading: authLoading } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Already signed in as admin → skip straight to dashboard
    useEffect(() => {
        if (authLoading) return;
        if (user && userDoc?.role === "admin") {
            router.replace("/admin/dashboard");
        }
    }, [user, userDoc, authLoading, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const credential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            // Verify admin role before granting access
            const userSnap = await getDoc(
                doc(db, "users", credential.user.uid)
            );

            if (!userSnap.exists() || userSnap.data().role !== "admin") {
                // Sign back out so no partial session is left
                await auth.signOut();
                setError(
                    "Access denied. This portal is for administrators only."
                );
                setLoading(false);
                return;
            }

            router.push("/admin/dashboard");
        } catch (err) {
            setError(
                AUTH_ERROR_MESSAGES[err.code] ??
                    "Sign-in failed. Please try again."
            );
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="items-center text-center">
                    <Image
                        src="/logo.png"
                        alt="Kueru"
                        width={48}
                        height={48}
                        className="mb-2 h-12 w-auto"
                    />
                    <CardTitle className="text-xl">Admin Portal</CardTitle>
                    <CardDescription>
                        Sign in with your administrator account
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@example.com"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full gap-2"
                            disabled={loading}
                        >
                            <IconLock className="size-4" />
                            {loading ? "Signing in…" : "Sign In"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
