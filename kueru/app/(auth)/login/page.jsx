"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { loginWithEmail, loginWithGoogle } from "@/lib/firebase/auth";
import { getUser } from "@/lib/db/userService";
import { IconMail, IconLock, IconEye, IconEyeOff } from "@tabler/icons-react";

import ConditionalNavbar from "@/components/ConditionalNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get("returnTo");
    const { user, onboardingComplete, loading: authLoading } = useAuth();

    useEffect(() => {
        if (authLoading || !user) return;
        if (onboardingComplete) router.replace(returnTo || "/profile");
        else if (onboardingComplete === false || onboardingComplete === null) router.replace("/onboarding");
    }, [user, onboardingComplete, authLoading, router, returnTo]);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const { user: loggedInUser } = await loginWithEmail(email, password);
            const userDoc = await getUser(loggedInUser.uid);
            if (!userDoc || !userDoc.onboardingComplete) {
                router.push("/onboarding");
            } else {
                router.push(returnTo || "/profile");
            }
        } catch (err) {
            setError("Invalid email or password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError("");
        try {
            const { user } = await loginWithGoogle();
            const existingDoc = await getUser(user.uid);
            if (!existingDoc) {
                router.push("/onboarding?google=1");
            } else if (existingDoc.onboardingComplete) {
                router.push(returnTo || "/profile");
            } else {
                router.push("/onboarding");
            }
        } catch (err) {
            setError("Google sign-in failed. Please try again.");
        }
    };

    return (
        <>
        <title>Log In | Kueru</title>
        <ConditionalNavbar />
        <div className="flex flex-col md:flex-row" style={{ minHeight: "calc(100vh - 3.5rem)" }}>

            {/* BRANDING PANEL — compact strip on mobile, full side panel on desktop */}
            <div className="relative flex md:flex-1 flex-col items-center justify-center overflow-hidden bg-primary text-primary-foreground py-8 md:py-0">
                {/* Decorative circle — top right */}
                <div className="absolute -top-16 -right-16 size-56 rounded-full bg-white/15" />

                {/* Mobile: horizontal layout — Desktop: vertical layout */}
                <div className="relative z-10 flex flex-row items-center gap-5 md:flex-col md:gap-2">
                    {/* Wrapper div controls the rendered size; object-contain prevents squashing */}
                    <div className="relative w-20 h-20 md:w-40 md:h-40 shrink-0">
                        <Image src="/logo.png" alt="Kueru logo" fill className="object-contain" />
                    </div>
                    <div className="flex flex-col md:items-center">
                        <p className="text-2xl font-bold tracking-widest md:mt-2 md:text-3xl">食える</p>
                        <p className="text-lg font-semibold md:text-xl">kueru</p>
                        <p className="hidden md:block mt-8 text-sm opacity-85">Share your culinary adventures</p>
                    </div>
                </div>
            </div>

            {/* FORM PANEL */}
            <div className="flex flex-1 items-center justify-center bg-background px-6 py-10 md:px-10">
                <div className="w-full max-w-md">
                        <h1 className="mb-2 text-3xl font-extrabold text-foreground">Welcome Back</h1>
                        <p className="mb-9 text-sm text-muted-foreground">
                            Log in to continue sharing and discovering amazing recipes
                        </p>

                        {error && (
                            <Alert variant="destructive" className="mb-5">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5">
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
                                        placeholder="Enter your password"
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
                                        {showPassword
                                            ? <IconEyeOff className="size-4" />
                                            : <IconEye className="size-4" />
                                        }
                                    </button>
                                </div>
                            </div>

                            {/* Remember me + Forgot password */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="remember"
                                        checked={remember}
                                        onCheckedChange={setRemember}
                                    />
                                    <Label htmlFor="remember" className="cursor-pointer font-normal">
                                        Remember me
                                    </Label>
                                </div>
                                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                                    Forgot password?
                                </Link>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-base font-semibold" size="lg">
                                {loading ? "Logging in..." : "Log In"}
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
                            onClick={handleGoogle}
                            className="w-full h-12 rounded-xl text-base font-semibold"
                            size="lg"
                        >
                            Continue with Google
                        </Button>

                        <p className="mt-8 text-center text-sm text-muted-foreground">
                            Don&apos;t have an account?{" "}
                            <Link href="/register" className="font-semibold text-primary hover:underline">
                                Sign Up
                            </Link>
                        </p>
                </div>
            </div>
        </div>
        </>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginForm />
        </Suspense>
    );
}
