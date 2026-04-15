"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { registerWithEmail, loginWithGoogle } from "@/lib/firebase/auth";
import { createUser, getUser, getUserByUsername } from "@/lib/db/userService";
import { IconUser, IconMail, IconLock, IconEye, IconEyeOff } from "@tabler/icons-react";

import ConditionalNavbar from "@/components/ConditionalNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const FIREBASE_ERRORS = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-email": "Please enter a valid email address.",
};

export default function RegisterPage() {
    const router = useRouter();
    const { user, onboardingComplete, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && user && onboardingComplete) router.replace("/profile");
    }, [user, onboardingComplete, authLoading, router]);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [usernameError, setUsernameError] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Validate username format
    const isValidUsername = (value) => /^[a-zA-Z0-9_]{3,20}$/.test(value);

    // Check uniqueness on blur
    const handleUsernameBlur = async () => {
        if (!username) return;
        if (!isValidUsername(username)) {
            setUsernameError("3–20 characters, letters, numbers and underscores only.");
            return;
        }
        const existing = await getUserByUsername(username);
        if (existing) {
            setUsernameError("This username is already taken.");
        } else {
            setUsernameError("");
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        if (!isValidUsername(username)) {
            setUsernameError("3–20 characters, letters, numbers and underscores only.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            const existing = await getUserByUsername(username);
            if (existing) {
                setUsernameError("This username is already taken.");
                setLoading(false);
                return;
            }
            const { user } = await registerWithEmail(email, password);
            await createUser(user.uid, { email, username });
            router.push("/onboarding");
        } catch (err) {
            setError(FIREBASE_ERRORS[err.code] || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setError("");
        setLoading(true);
        try {
            const { user } = await loginWithGoogle();
            const existingDoc = await getUser(user.uid);
            if (!existingDoc) {
                router.push("/onboarding?google=1");
            } else if (existingDoc.onboardingComplete) {
                router.push("/profile");
            } else {
                router.push("/onboarding");
            }
        } catch (err) {
            setError("Google sign-in failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <title>Sign Up | Kueru</title>
        <ConditionalNavbar />
        <div className="flex flex-col md:flex-row" style={{ minHeight: "calc(100vh - 3.5rem)" }}>

            {/* LEFT PANEL — form */}
            <div className="flex flex-1 items-center justify-center bg-background px-6 py-10 md:px-10">
                <div className="w-full max-w-md">
                    <h1 className="mb-2 text-3xl font-extrabold text-foreground">Create Account</h1>
                    <p className="mb-9 text-sm text-muted-foreground">
                        Join us and start sharing your culinary adventures
                    </p>

                    {error && (
                        <Alert variant="destructive" className="mb-5">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5">
                        {/* Username */}
                        <div className="space-y-1.5">
                            <Label htmlFor="username">Username</Label>
                            <div className="relative">
                                <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Choose a username"
                                    value={username}
                                    onChange={(e) => { setUsername(e.target.value); setUsernameError(""); }}
                                    onBlur={handleUsernameBlur}
                                    required
                                    className="pl-9 h-12 rounded-xl"
                                />
                            </div>
                            {usernameError && (
                                <p className="text-xs text-destructive">{usernameError}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your.email@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="pl-9 h-12 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="pl-9 pr-10 h-12 rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirm ? "text" : "password"}
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="pl-9 pr-10 h-12 rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    aria-label={showConfirm ? "Hide password" : "Show password"}
                                >
                                    {showConfirm ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-xl text-base font-semibold"
                            size="lg"
                        >
                            {loading ? "Creating account..." : "Continue"}
                        </Button>
                    </form>

                    <div className="my-6 flex items-center gap-3">
                        <Separator className="flex-1" />
                        <span className="text-xs text-muted-foreground">OR</span>
                        <Separator className="flex-1" />
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoogleRegister}
                        disabled={loading}
                        className="w-full h-12 rounded-xl text-base font-semibold"
                        size="lg"
                    >
                        Continue with Google
                    </Button>

                    <p className="mt-8 text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="font-semibold text-primary hover:underline">
                            Log In
                        </Link>
                    </p>
                </div>
            </div>

            {/* RIGHT PANEL — branding */}
            <div className="relative flex md:flex-1 flex-col items-center justify-center overflow-hidden bg-primary text-primary-foreground py-8 md:py-0">
                <div className="absolute -top-16 -right-16 size-56 rounded-full bg-white/15" />
                <div className="relative z-10 flex flex-row items-center gap-5 md:flex-col md:gap-2">
                    <div className="relative w-20 h-20 md:w-40 md:h-40 shrink-0">
                        <Image src="/logo.png" alt="Kueru logo" fill className="object-contain" />
                    </div>
                    <div className="flex flex-col md:items-center">
                        <p className="text-2xl font-bold tracking-widest md:mt-2 md:text-3xl">食える</p>
                        <p className="text-lg font-semibold md:text-xl">kueru</p>
                        <p className="hidden md:block mt-8 text-sm opacity-85">Set up your account</p>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}
