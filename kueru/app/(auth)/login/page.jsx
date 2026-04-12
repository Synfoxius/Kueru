"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { loginWithEmail, loginWithGoogle } from "@/lib/firebase/auth";
import { IconMail, IconLock, IconEye, IconEyeOff } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
    const router = useRouter();
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
            await loginWithEmail(email, password);
            router.push("/feed");
        } catch (err) {
            setError("Invalid email or password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError("");
        try {
            await loginWithGoogle();
            router.push("/feed");
        } catch (err) {
            setError("Google sign-in failed. Please try again.");
        }
    };

    return (
        <div className="flex h-screen">

            {/* LEFT PANEL — branding */}
            <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-primary text-primary-foreground">
                {/* Decorative circle — top right */}
                <div className="absolute -top-16 -right-16 size-56 rounded-full bg-white/15" />

                <div className="relative z-10 flex flex-col items-center gap-1">
                    <Image src="/logo.png" alt="Kueru logo" width={144} height={144} />
                    <p className="mt-2 text-2xl font-bold tracking-widest">食える</p>
                    <p className="text-lg font-semibold">kueru</p>
                    <p className="mt-8 text-sm opacity-85">Share your culinary adventures</p>
                </div>
            </div>

            {/* RIGHT PANEL — login form */}
            <div className="flex flex-1 items-center justify-center bg-background px-10" >
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
    );
}
