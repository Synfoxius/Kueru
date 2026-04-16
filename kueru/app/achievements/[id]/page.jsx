"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getAchievementById, getUserAchievementProgress } from "@/lib/db/achievementService";
import { getRecipesByIds } from "@/lib/db/recipeService";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { IconArrowLeft, IconTrophy, IconFlame, IconWorld, IconMedal, IconStar } from "@tabler/icons-react";
import Navbar from "@/components/Navbar";
import { LinkedPostCard, AddPostCard } from "./_components/LinkedPostCard";

/** Returns the icon component for a given achievement category. */
function getCategoryIcon(category) {
    switch (category) {
        case "Cooking Streaks": return IconFlame;
        case "Exploration":     return IconWorld;
        case "Skill Badges":    return IconMedal;
        case "Milestones":      return IconStar;
        default:                return IconTrophy;
    }
}

/** Formats a Firestore Timestamp or plain value into "Jan 15, 2026" */
function formatDate(timestamp) {
    if (!timestamp) return "";
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AchievementDetailPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const achievementId = params.id;

    const [achievement, setAchievement] = useState(null);
    const [progress, setProgress] = useState(null);
    const [linkedRecipes, setLinkedRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) router.replace("/login");
    }, [authLoading, user, router]);

    useEffect(() => {
        if (!user || !achievementId) return;

        let isMounted = true;

        const load = async () => {
            setLoading(true);
            try {
                const [achiev, progressMap] = await Promise.all([
                    getAchievementById(achievementId),
                    getUserAchievementProgress(user.uid),
                ]);

                if (!isMounted) return;

                const prog = progressMap[achievementId] ?? null;
                const recipes = prog?.linkedRecipeIds?.length
                    ? await getRecipesByIds(prog.linkedRecipeIds)
                    : [];

                if (!isMounted) return;

                setAchievement(achiev);
                setProgress(prog);
                setLinkedRecipes(recipes);
            } catch (err) {
                console.error("Failed to load achievement detail:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        load();
        return () => { isMounted = false; };
    }, [user, achievementId]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-muted/30">
                <Navbar />
                <main className="mx-auto max-w-3xl px-4 py-8">
                    <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                        Loading...
                    </div>
                </main>
            </div>
        );
    }

    if (!achievement) {
        return (
            <div className="min-h-screen bg-muted/30">
                <Navbar />
                <main className="mx-auto max-w-3xl px-4 py-8">
                    <p className="text-sm text-muted-foreground">Achievement not found.</p>
                </main>
            </div>
        );
    }

    const isCompleted = progress?.status === "completed";
    const currentValue = progress?.currentValue ?? 0;
    const progressPercent = achievement.goalValue > 0
        ? Math.min((currentValue / achievement.goalValue) * 100, 100)
        : 0;
    const CategoryIcon = getCategoryIcon(achievement.category);

    return (
        <div className="min-h-screen bg-muted/30">
            <Navbar />
            <main className="mx-auto max-w-3xl px-4 py-8">
                {/* Back link */}
                <Link
                    href="/achievements"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                    <IconArrowLeft className="size-4" />
                    Back to Achievements
                </Link>

                {/* Achievement card */}
                <Card className="mb-8 bg-white">
                    <CardContent className="p-6 space-y-5">
                        {/* Category + title row */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    {achievement.category}
                                </p>
                                <h1 className="text-xl font-bold leading-snug">{achievement.title}</h1>
                                <p className="text-sm text-muted-foreground">{achievement.description}</p>
                            </div>
                            <div className="shrink-0 flex flex-col items-center gap-2">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isCompleted ? "bg-primary" : "bg-muted"}`}>
                                    <CategoryIcon className={`size-6 ${isCompleted ? "text-primary-foreground" : "text-muted-foreground"}`} />
                                </div>
                                {isCompleted && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground whitespace-nowrap">
                                        ✓ Completed
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-semibold text-primary">
                                    {currentValue}/{achievement.goalValue}
                                    {achievement.unit ? ` ${achievement.unit}` : ""}
                                </span>
                            </div>
                            <Progress value={progressPercent} className="h-2.5" />
                        </div>

                        {/* Completion message */}
                        {isCompleted && (
                            <p className="text-sm text-muted-foreground">
                                Well done! You completed this challenge on{" "}
                                <span className="text-foreground font-medium">
                                    {formatDate(progress?.lastUpdated)}
                                </span>
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Linked Posts */}
                <div>
                    <h2 className="text-lg font-bold mb-1">
                        Linked Posts ({linkedRecipes.length})
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        All the posts that contributed to this achievement
                    </p>

                    <div className="grid grid-cols-3 gap-4">
                        {linkedRecipes.map((recipe) => (
                            <LinkedPostCard key={recipe.id} recipe={recipe} />
                        ))}
                        {!isCompleted && <AddPostCard />}
                    </div>

                    {linkedRecipes.length === 0 && isCompleted && (
                        <p className="text-sm text-muted-foreground">No linked posts.</p>
                    )}
                </div>
            </main>
        </div>
    );
}
