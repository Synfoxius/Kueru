"use client";

/**
 * DEV-ONLY page. Seeds the achievements collection with test data.
 * DELETE this entire /dev folder before deploying to production.
 *
 * Usage: visit http://localhost:3000/dev/seed-achievements
 */

import { useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ACHIEVEMENTS = [
    {
        title: "Your First Bite",
        description: "Post your first recipe",
        category: "Milestones",
        goalValue: 1,
        unit: "recipes",
        trackingType: "count",
        iconURL: "",
    },
    {
        title: "Kitchen Regular",
        description: "Post 10 recipes",
        category: "Milestones",
        goalValue: 10,
        unit: "recipes",
        trackingType: "count",
        iconURL: "",
    },
    {
        title: "Executive Chef",
        description: "Post 50 recipes",
        category: "Milestones",
        goalValue: 50,
        unit: "recipes",
        trackingType: "count",
        iconURL: "",
    },
    {
        title: "Global Palate",
        description: "Post separate recipes from 3 different cuisines",
        category: "Exploration",
        goalValue: 3,
        unit: "cuisines",
        trackingType: "unique_count",
        iconURL: "",
    },
    {
        title: "High Five",
        description: "Post a recipe that uses exactly 5 ingredients",
        category: "Skill Badges",
        goalValue: 5,
        unit: "ingredients",
        trackingType: "exact_match",
        iconURL: "",
    },
    {
        title: "Green Thumb",
        description: "Post 5 vegan recipes",
        category: "Exploration",
        goalValue: 5,
        unit: "recipes",
        trackingType: "count",
        iconURL: "",
    },
    {
        title: "Sunday Meal Prep",
        description: "Post a recipe on 4 consecutive Sundays",
        category: "Cooking Streaks",
        goalValue: 4,
        unit: "Sundays",
        trackingType: "weekly_streak",
        iconURL: "",
    },
    {
        title: "Week-long Whiz",
        description: "Post a recipe 7 days in a row",
        category: "Cooking Streaks",
        goalValue: 7,
        unit: "days",
        trackingType: "streak",
        iconURL: "",
    },
];

export default function SeedAchievementsPage() {
    const [status, setStatus] = useState("idle"); // "idle" | "loading" | "success" | "error"
    const [message, setMessage] = useState("");

    const handleSeed = async () => {
        setStatus("loading");
        setMessage("");
        try {
            const achievementsRef = collection(db, "achievements");

            // Warn if collection already has documents
            const existing = await getDocs(achievementsRef);
            if (!existing.empty) {
                setStatus("error");
                setMessage(
                    `Collection already has ${existing.size} document(s). Clear it in the Emulator UI first if you want to re-seed.`
                );
                return;
            }

            const batch = writeBatch(db);
            ACHIEVEMENTS.forEach((achievement) => {
                batch.set(doc(achievementsRef), achievement);
            });
            await batch.commit();

            setStatus("success");
            setMessage(`Successfully seeded ${ACHIEVEMENTS.length} achievements.`);
        } catch (err) {
            setStatus("error");
            setMessage(err.message);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-muted/30 p-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-base">Seed Achievements (Dev Only)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Writes {ACHIEVEMENTS.length} test achievements to Firestore.
                        Make sure your emulator is running first.
                    </p>

                    <Button
                        onClick={handleSeed}
                        disabled={status === "loading" || status === "success"}
                        className="w-full"
                    >
                        {status === "loading" ? "Seeding..." : "Seed Achievements"}
                    </Button>

                    {message && (
                        <p
                            className={`text-sm ${
                                status === "success" ? "text-green-600" : "text-destructive"
                            }`}
                        >
                            {message}
                        </p>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
