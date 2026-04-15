"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconCircleCheck } from "@tabler/icons-react";

import { useAuth } from "@/context/AuthContext";
import { completeOnboarding } from "@/lib/db/userService";

import ConditionalNavbar from "@/components/ConditionalNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── Option data (mirrors onboarding) ─────────────────────────────────────────

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
    { value: "Beginner",     subtitle: "Just starting my culinary journey" },
    { value: "Intermediate", subtitle: "Comfortable with everyday cooking" },
    { value: "Advanced",     subtitle: "Can tackle complex techniques" },
    { value: "Expert",       subtitle: "Professional-level skills" },
];

const INTEREST_OPTIONS = [
    "Italian", "Mexican", "Japanese", "Chinese", "Indian", "Thai",
    "French", "Korean", "Vietnamese", "American",
    "Middle Eastern", "Spanish", "Greek", "Vegetarian", "Vegan",
    "Muslim", "Seafood",
];

// ── Toggle pill ───────────────────────────────────────────────────────────────

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

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title, description }) {
    return (
        <div className="mb-4">
            <h2 className="text-base font-semibold">{title}</h2>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PreferencesPage() {
    const router = useRouter();
    const { user, userDoc, loading } = useAuth();

    const [dietaryPreferences, setDietaryPreferences] = useState([]);
    const [foodAllergies, setFoodAllergies] = useState([]);
    const [cookingSkill, setCookingSkill] = useState("");
    const [recipeInterests, setRecipeInterests] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    // Populate from existing userDoc once loaded
    useEffect(() => {
        if (!userDoc?.onboarding) return;
        const { dietaryPreferences = [], foodAllergies = [], cookingSkill = "", recipeInterests = [] } = userDoc.onboarding;
        setDietaryPreferences(dietaryPreferences);
        setFoodAllergies(foodAllergies);
        setCookingSkill(cookingSkill);
        setRecipeInterests(recipeInterests);
    }, [userDoc]);

    if (loading) {
        return (
            <>
                <ConditionalNavbar />
                <div className="flex h-[60vh] items-center justify-center text-muted-foreground text-sm">
                    Loading...
                </div>
            </>
        );
    }

    if (!user) {
        router.push("/login");
        return null;
    }

    const toggleItem = (setter) => (item) =>
        setter(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setSaved(false);
        try {
            await completeOnboarding(user.uid, {
                dietaryPreferences,
                foodAllergies,
                cookingSkill,
                recipeInterests,
            });
            setSaved(true);
        } catch {
            setError("Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <title>Edit Preferences | Kueru</title>
            <ConditionalNavbar />
            <main className="mx-auto w-full max-w-xl px-4 py-10 space-y-10">

                {/* Header */}
                <div>
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Edit Preferences</h1>
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <IconArrowLeft className="size-4" /> Back
                        </button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Update your dietary needs, allergies, cooking level and cuisine interests</p>
                </div>

                {/* Dietary Preferences */}
                <section>
                    <SectionHeader
                        title="Dietary Preferences"
                        description="Select all that apply to you"
                    />
                    <div className="flex flex-wrap gap-2">
                        {DIETARY_OPTIONS.map(opt => (
                            <TogglePill
                                key={opt}
                                label={opt}
                                selected={dietaryPreferences.includes(opt)}
                                onToggle={toggleItem(setDietaryPreferences)}
                            />
                        ))}
                    </div>
                </section>

                {/* Food Allergies */}
                <section>
                    <SectionHeader
                        title="Food Allergies"
                        description="Skip if you don't have any allergies"
                    />
                    <div className="flex flex-wrap gap-2">
                        {ALLERGY_OPTIONS.map(opt => (
                            <TogglePill
                                key={opt}
                                label={opt}
                                selected={foodAllergies.includes(opt)}
                                onToggle={toggleItem(setFoodAllergies)}
                            />
                        ))}
                    </div>
                </section>

                {/* Cooking Skill */}
                <section>
                    <SectionHeader title="Cooking Skill Level" />
                    <div className="space-y-3">
                        {SKILL_OPTIONS.map(opt => (
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
                                    <p className="font-semibold text-sm">{opt.value}</p>
                                    <p className="text-xs text-muted-foreground">{opt.subtitle}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Cuisine Interests */}
                <section>
                    <SectionHeader
                        title="Cuisine Interests"
                        description="Choose your favourite cuisines"
                    />
                    <div className="flex flex-wrap gap-2">
                        {INTEREST_OPTIONS.map(opt => (
                            <TogglePill
                                key={opt}
                                label={opt}
                                selected={recipeInterests.includes(opt)}
                                onToggle={toggleItem(setRecipeInterests)}
                            />
                        ))}
                    </div>
                </section>

                {/* Save */}
                {error && <p className="text-sm text-destructive">{error}</p>}
                {saved && (
                    <p className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                        <IconCircleCheck className="size-4" /> Preferences saved
                    </p>
                )}
                <div className="flex gap-3 pb-8">
                    <Button variant="outline" className="flex-1" onClick={() => router.back()} disabled={saving}>
                        Cancel
                    </Button>
                    <Button className="flex-1" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save Preferences"}
                    </Button>
                </div>

            </main>
        </>
    );
}
