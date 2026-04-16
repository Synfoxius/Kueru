"use client";

import Link from "next/link";
import Image from "next/image";
import { IconTrophy, IconFlame, IconWorld, IconMedal, IconStar } from "@tabler/icons-react";

function getCategoryIcon(category) {
    switch (category) {
        case "Cooking Streaks": return IconFlame;
        case "Exploration":     return IconWorld;
        case "Skill Badges":    return IconMedal;
        case "Milestones":      return IconStar;
        default:                return IconTrophy;
    }
}
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/**
 * Formats a Firestore Timestamp or date string into a readable date.
 * e.g. "Jan 15, 2026"
 */
function formatDate(timestamp) {
    if (!timestamp) return "";
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Displays a single achievement card in one of three visual states:
 *  - completed:    orange border, coloured icon, "Completed on [date]"
 *  - in_progress:  default border, coloured icon, progress bar + "X/Y unit"
 *  - not started:  default border, greyed icon, no progress
 *
 * @param {{ achievement: object, userProgress: object|null }} props
 */
export default function AchievementCard({ achievement, userProgress }) {
    const { id, title, description, category, goalValue, unit, iconURL } = achievement;
    const CategoryIcon = getCategoryIcon(category);

    const isCompleted = userProgress?.status === "completed";
    const isInProgress = userProgress?.status === "in_progress";
    const currentValue = userProgress?.currentValue ?? 0;
    const progressPercent = goalValue > 0 ? Math.min((currentValue / goalValue) * 100, 100) : 0;

    return (
        <Link href={`/achievements/${id}`} className="block">
        <Card
            className={cn(
                "transition-colors hover:bg-muted/50 bg-white",
                isCompleted && "border-primary border-2"
            )}
        >
            <CardContent className="flex items-start gap-3 p-4">
                {/* Icon */}
                <div
                    className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        isCompleted || isInProgress ? "bg-primary" : "bg-muted"
                    )}
                >
                    {iconURL ? (
                        <Image
                            src={iconURL}
                            alt={title}
                            width={24}
                            height={24}
                            className="h-6 w-6 object-contain"
                        />
                    ) : (
                        <CategoryIcon
                            className={cn(
                                "h-5 w-5",
                                isCompleted || isInProgress
                                    ? "text-primary-foreground"
                                    : "text-muted-foreground"
                            )}
                        />
                    )}
                </div>

                {/* Text + progress */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>

                    {isCompleted && (
                        <p className="text-xs text-primary mt-2">
                            Completed on {formatDate(userProgress?.lastUpdated)}
                        </p>
                    )}

                    {isInProgress && (
                        <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Progress</span>
                                <span className="text-primary font-medium">
                                    {currentValue}/{goalValue}{unit ? ` ${unit}` : ""}
                                </span>
                            </div>
                            <Progress value={progressPercent} className="h-2" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
        </Link>
    );
}
