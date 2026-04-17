"use client";

/**
 * DEV-ONLY page. Seeds the challenges collection with test data.
 * DELETE this entire /dev folder before deploying to production.
 *
 * Usage: visit http://localhost:3000/dev/seed-challenges
 */

import { useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, doc, getDocs, setDoc, writeBatch, Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function daysFromNow(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return Timestamp.fromDate(d);
}

function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return Timestamp.fromDate(d);
}

const CHALLENGES = [
    {
        title: "Meatless Meals",
        description: "Cook 7 vegetarian meals for the week",
        startDate: daysAgo(5),
        endDate: daysFromNow(3),
        goalValue: 7,
        currentValue: 0,
        participantCount: 0,
        status: "active",
        iconName: "heart",
        challengeType: "individual",
        difficulty: "Easy",
        condition: { type: "tag_includes_any", values: ["Vegetarian", "Vegan"] },
    },
    {
        title: "Cuisines Around the World",
        description: "Try 5 dishes from 5 different cuisines",
        startDate: daysAgo(2),
        endDate: daysFromNow(18),
        goalValue: 5,
        currentValue: 0,
        participantCount: 0,
        status: "active",
        iconName: "world",
        challengeType: "individual",
        difficulty: "Medium",
        condition: { type: "unique_cuisine_tags" },
    },
    {
        title: "Under 30 Minutes",
        description: "Cook quick meals that take less than 30 minutes",
        startDate: daysAgo(1),
        endDate: daysFromNow(14),
        goalValue: 5,
        currentValue: 0,
        participantCount: 0,
        status: "active",
        iconName: "bolt",
        challengeType: "individual",
        difficulty: "Easy",
        condition: null,
    },
    {
        title: "Only Eggs!",
        description: "Post the most interesting dish using no other ingredients except eggs",
        startDate: daysAgo(0),
        endDate: daysFromNow(21),
        goalValue: 3,
        currentValue: 0,
        participantCount: 0,
        status: "active",
        iconName: "egg",
        challengeType: "individual",
        difficulty: "Easy",
        condition: null,
    },
    {
        title: "Halal Alternatives",
        description: "Showcase halal versions of meals that aren't normally halal",
        startDate: daysAgo(0),
        endDate: daysFromNow(30),
        goalValue: 5,
        currentValue: 0,
        participantCount: 0,
        status: "active",
        iconName: "star",
        challengeType: "individual",
        difficulty: "Easy",
        condition: null,
    },
    {
        title: "Plant Based Food",
        description: "Cook 8888 vegan dishes collectively this month to obtain the vegan champion badge!",
        startDate: daysAgo(0),
        endDate: daysFromNow(30),
        goalValue: 8888,
        currentValue: 0,
        participantCount: 0,
        status: "active",
        iconName: "leaf",
        challengeType: "collective",
        difficulty: "Easy",
        condition: { type: "tag_includes", value: "Vegan" },
    },
];

export default function SeedChallengesPage() {
    const [status, setStatus] = useState("idle");
    const [log, setLog] = useState([]);

    const addLog = (msg) => setLog((prev) => [...prev, msg]);

    const handleSeed = async () => {
        setStatus("running");
        setLog([]);

        try {
            // Clear existing challenges
            addLog("Clearing existing challenges...");
            const existingSnap = await getDocs(collection(db, "challenges"));
            if (!existingSnap.empty) {
                const batch = writeBatch(db);
                existingSnap.docs.forEach((d) => batch.delete(d.ref));
                await batch.commit();
                addLog(`Deleted ${existingSnap.size} existing challenge(s).`);
            }

            // Seed new challenges
            addLog("Seeding challenges...");
            for (const challenge of CHALLENGES) {
                const ref = doc(collection(db, "challenges"));
                await setDoc(ref, challenge);
                addLog(`✓ Created: ${challenge.title} (${ref.id})`);
            }

            addLog("Done! All challenges seeded successfully.");
            setStatus("done");
        } catch (err) {
            addLog(`Error: ${err.message}`);
            setStatus("error");
        }
    };

    return (
        <main className="mx-auto max-w-2xl px-4 py-12">
            <Card>
                <CardHeader>
                    <CardTitle>Seed Challenges (DEV ONLY)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        This will <strong>delete all existing challenges</strong> and replace them with{" "}
                        {CHALLENGES.length} sample challenges.
                    </p>
                    <Button
                        onClick={handleSeed}
                        disabled={status === "running"}
                        className="w-full"
                    >
                        {status === "running" ? "Seeding..." : "Seed Challenges"}
                    </Button>
                    {log.length > 0 && (
                        <div className="rounded-md bg-muted p-4 font-mono text-xs space-y-1">
                            {log.map((line, i) => (
                                <p key={i}>{line}</p>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
