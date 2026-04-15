"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { createUser, completeOnboarding, getUserByUsername } from "@/lib/db/userService";
import { IconCircleCheck, IconUser } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Step metadata ────────────────────────────────────────────────────────────

const STEP_META = {
    0: { label: "Set up your username", desc: "Choose how others will know you" },
    1: { label: "Step 1 of 4", desc: "Tell us about your dietary needs" },
    2: { label: "Step 2 of 4", desc: "Keep your recommendations safe" },
    3: { label: "Step 3 of 4", desc: "Help us match recipes to your level" },
    4: { label: "Step 4 of 4", desc: "Choose your favourite cuisines" },
    5: { label: "Welcome!", desc: "Your culinary adventure begins" },
};

// ─── Option data ──────────────────────────────────────────────────────────────

const DIETARY_OPTIONS = [
    "Vegan", "Vegetarian", "Keto", "Paleo",
    "Gluten-free", "Dairy-free", "Halal", "Kosher",
    "Low-carb", "Pescatarian",
];

const ALLERGY_OPTIONS = [
    "Peanuts", "Tree Nuts", "Milk", "Eggs",
    "Wheat", "Soy", "Fish", "Shellfish", "Sesame",
];

const SKILL_OPTIONS = [
    { value: "Beginner", label: "Beginner", subtitle: "Just starting my culinary journey" },
    { value: "Intermediate", label: "Intermediate", subtitle: "Comfortable with everyday cooking" },
    { value: "Advanced", label: "Advanced", subtitle: "Can tackle complex techniques" },
    { value: "Expert", label: "Expert", subtitle: "Professional-level skills" },
];

const INTEREST_OPTIONS = [
    "Italian", "Mexican", "Japanese", "Chinese", "Indian", "Thai",
    "French", "Mediterranean", "Korean", "Vietnamese", "American",
    "Middle Eastern", "Spanish", "Greek", "Vegetarian", "Vegan",
    "Desserts", "Baking", "BBQ & Grilling", "Seafood",
];

// ─── Reusable toggle pill ─────────────────────────────────────────────────────

function TogglePill({ label, selected, onToggle }) {
    return (
        <Button
            type="button"
            variant={selected ? "default" : "outline"}
            className="rounded-full px-4 py-2 h-auto text-sm"
            onClick={() => onToggle(label)}
        >
            {label}
        </Button>
    );
}

// ─── Main onboarding component (uses useSearchParams) ────────────────────────

function OnboardingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const googleMode = searchParams.get("google") === "1";

    const { user, userDoc, loading } = useAuth();

    const [step, setStep] = useState(googleMode ? 0 : 1);
    const [username, setUsername] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [dietaryPreferences, setDietaryPreferences] = useState([]);
    const [foodAllergies, setFoodAllergies] = useState([]);
    const [cookingSkill, setCookingSkill] = useState("");
    const [recipeInterests, setRecipeInterests] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const completedRef = useRef(false);

    // Page-level guard
    useEffect(() => {
        if (loading) return;
        if (!user) { router.push("/login"); return; }
        if (userDoc?.onboardingComplete === true && !completedRef.current) { router.push("/profile"); return; }
    }, [loading, user, userDoc, router]);

    if (loading || !user) return null;

    // ── Helpers ──────────────────────────────────────────────────────────────

    const toggleItem = (setter) => (item) => {
        setter((prev) =>
            prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
        );
    };

    const progressValue = step >= 1 && step <= 4 ? ((step - 1) / 4) * 100 : step === 5 ? 100 : 0;

    // ── Step 0 — Username capture (Google path) ───────────────────────────────

    const isValidUsername = (v) => /^[a-zA-Z0-9_]{3,20}$/.test(v);

    const handleUsernameBlur = async () => {
        if (!username) return;
        if (!isValidUsername(username)) {
            setUsernameError("3–20 characters, letters, numbers and underscores only.");
            return;
        }
        const existing = await getUserByUsername(username);
        setUsernameError(existing ? "This username is already taken." : "");
    };

    const handleUsernameSubmit = async () => {
        if (!isValidUsername(username)) {
            setUsernameError("3–20 characters, letters, numbers and underscores only.");
            return;
        }
        setSubmitting(true);
        try {
            const existing = await getUserByUsername(username);
            if (existing) { setUsernameError("This username is already taken."); return; }
            await createUser(user.uid, {
                email: user.email,
                username,
                profileImage: user.photoURL || '',
            });
            setStep(1);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Step 4 → 5 — Save and complete ───────────────────────────────────────

    const handleFinish = async () => {
        setSubmitting(true);
        try {
            completedRef.current = true;
            await completeOnboarding(user.uid, {
                dietaryPreferences,
                foodAllergies,
                cookingSkill,
                recipeInterests,
            });
            setStep(5);
        } catch {
            setError("Failed to save your preferences. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Step renderers ────────────────────────────────────────────────────────

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <div className="space-y-5">
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
                                    className="pl-9 h-12 rounded-xl"
                                />
                            </div>
                            {usernameError && <p className="text-xs text-destructive">{usernameError}</p>}
                        </div>
                        <Button
                            onClick={handleUsernameSubmit}
                            disabled={submitting || !username}
                            className="w-full h-12 rounded-xl text-base font-semibold"
                            size="lg"
                        >
                            {submitting ? "Saving..." : "Continue"}
                        </Button>
                    </div>
                );

            case 1:
                return (
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-2">
                            {DIETARY_OPTIONS.map((opt) => (
                                <TogglePill
                                    key={opt}
                                    label={opt}
                                    selected={dietaryPreferences.includes(opt)}
                                    onToggle={toggleItem(setDietaryPreferences)}
                                />
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setStep(0)} disabled={!googleMode} className="flex-1 h-11 rounded-xl">← Back</Button>
                            <Button onClick={() => setStep(2)} disabled={dietaryPreferences.length === 0} className="flex-1 h-11 rounded-xl">Continue →</Button>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <p className="text-xs text-muted-foreground">Skip if you don&apos;t have any allergies</p>
                        <div className="flex flex-wrap gap-2">
                            {ALLERGY_OPTIONS.map((opt) => (
                                <TogglePill
                                    key={opt}
                                    label={opt}
                                    selected={foodAllergies.includes(opt)}
                                    onToggle={toggleItem(setFoodAllergies)}
                                />
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-11 rounded-xl">← Back</Button>
                            <Button onClick={() => setStep(3)} className="flex-1 h-11 rounded-xl">Continue →</Button>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            {SKILL_OPTIONS.map((opt) => (
                                <Card
                                    key={opt.value}
                                    className={cn(
                                        "cursor-pointer transition-all",
                                        cookingSkill === opt.value
                                            ? "ring-2 ring-primary bg-primary/5"
                                            : "hover:bg-muted/50"
                                    )}
                                    onClick={() => setCookingSkill(opt.value)}
                                >
                                    <CardContent className="py-3">
                                        <p className="font-semibold text-sm">{opt.label}</p>
                                        <p className="text-xs text-muted-foreground">{opt.subtitle}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-11 rounded-xl">← Back</Button>
                            <Button onClick={() => setStep(4)} disabled={!cookingSkill} className="flex-1 h-11 rounded-xl">Continue →</Button>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-2">
                            {INTEREST_OPTIONS.map((opt) => (
                                <TogglePill
                                    key={opt}
                                    label={opt}
                                    selected={recipeInterests.includes(opt)}
                                    onToggle={toggleItem(setRecipeInterests)}
                                />
                            ))}
                        </div>
                        {error && <p className="text-xs text-destructive">{error}</p>}
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setStep(3)} className="flex-1 h-11 rounded-xl">← Back</Button>
                            <Button
                                onClick={handleFinish}
                                disabled={submitting || recipeInterests.length === 0}
                                className="flex-1 h-11 rounded-xl"
                            >
                                {submitting ? "Saving..." : "Complete Setup →"}
                            </Button>
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="flex flex-col items-center gap-6 py-8 text-center">
                        <IconCircleCheck className="size-20 text-primary" strokeWidth={1.5} />
                        <div>
                            <h2 className="text-2xl font-extrabold text-foreground">You&apos;re All Set!</h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Your account has been created successfully.
                            </p>
                        </div>
                        <Button className="w-full h-12 rounded-xl text-base font-semibold" onClick={() => router.push("/profile")}>
                            Continue to Profile
                        </Button>
                    </div>
                );

            default:
                return null;
        }
    };

    // ── Layout ────────────────────────────────────────────────────────────────

    const meta = STEP_META[step] ?? STEP_META[1];

    return (
        <>
        <title>Getting Started | Kueru</title>
        <div className="flex min-h-screen flex-col md:flex-row">

            {/* LEFT PANEL — form */}
            <div className="flex flex-1 items-center justify-center bg-background px-6 py-10 md:px-10">
                <div className="w-full max-w-md">
                    {/* Progress bar (steps 1–4 only) */}
                    {step >= 1 && step <= 4 && (
                        <div className="mb-8">
                            <Progress value={progressValue} className="h-1.5 rounded-full" />
                        </div>
                    )}

                    <h1 className="mb-2 text-2xl font-extrabold text-foreground">{meta.label}</h1>
                    <p className="mb-8 text-sm text-muted-foreground">{meta.desc}</p>

                    {renderStep()}
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
                        {step >= 1 && step <= 4 && (
                            <div className="hidden md:block mt-8 text-center">
                                <p className="text-sm font-semibold">{meta.label}</p>
                                <p className="text-xs opacity-75 mt-1">{meta.desc}</p>
                            </div>
                        )}
                        {step === 5 && (
                            <p className="hidden md:block mt-8 text-sm opacity-85">Welcome to our community!</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}

// Wrap in Suspense — required by Next.js App Router for useSearchParams
export default function Page() {
    return (
        <Suspense fallback={null}>
            <OnboardingPage />
        </Suspense>
    );
}
