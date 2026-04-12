"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { resetPassword } from "@/lib/firebase/auth";
import { IconMail, IconMailCheck } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const FIREBASE_ERRORS = {
    "auth/invalid-email": "Please enter a valid email address.",
};

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await resetPassword(email);
            setSent(true);
        } catch (err) {
            // Don't reveal whether the email exists — only surface format errors
            if (err.code === "auth/invalid-email") {
                setError(FIREBASE_ERRORS["auth/invalid-email"]);
            } else {
                setSent(true); // Treat unknown emails as success (security best practice)
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col md:flex-row">

            {/* LEFT PANEL — form */}
            <div className="flex flex-1 items-center justify-center bg-background px-6 py-10 md:px-10">
                <div className="w-full max-w-md">
                    {sent ? (
                        /* Success view */
                        <div className="flex flex-col items-center gap-6 text-center">
                            <IconMailCheck className="size-16 text-primary" strokeWidth={1.5} />
                            <div>
                                <h1 className="text-2xl font-extrabold text-foreground">Check your email</h1>
                                <p className="mt-3 text-sm text-muted-foreground">
                                    A reset link has been sent to <span className="font-medium text-foreground">{email}</span>.
                                    Check your inbox and follow the instructions.
                                </p>
                            </div>
                            <Button asChild className="w-full h-12 rounded-xl text-base font-semibold" size="lg">
                                <Link href="/login">Back to Log In</Link>
                            </Button>
                        </div>
                    ) : (
                        /* Form view */
                        <>
                            <h1 className="mb-2 text-3xl font-extrabold text-foreground">Reset Password</h1>
                            <p className="mb-9 text-sm text-muted-foreground">
                                Enter your email and we&apos;ll send you a reset link
                            </p>

                            {error && (
                                <Alert variant="destructive" className="mb-5">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
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

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 rounded-xl text-base font-semibold"
                                    size="lg"
                                >
                                    {loading ? "Sending..." : "Send Reset Link"}
                                </Button>
                            </form>

                            <p className="mt-8 text-center text-sm text-muted-foreground">
                                <Link href="/login" className="font-semibold text-primary hover:underline">
                                    Back to Log In
                                </Link>
                            </p>
                        </>
                    )}
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
                        <p className="hidden md:block mt-8 text-sm opacity-85">We&apos;ll get you back in</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
