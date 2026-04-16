"use client";

import { Separator } from "@/components/ui/separator";
import AchievementCard from "./AchievementCard";

/**
 * Renders one category section: heading, "X/Y completed" counter,
 * a separator, then a 2-column grid of AchievementCards.
 *
 * @param {{
 *   category: string,
 *   achievements: Array<object>,
 *   progressMap: { [achievementId: string]: object }
 * }} props
 */
export default function AchievementSection({ category, achievements, progressMap }) {
    const completedCount = achievements.filter(
        (a) => progressMap[a.id]?.status === "completed"
    ).length;

    return (
        <section>
            <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-semibold">{category}</h2>
                <span className="text-xs text-muted-foreground">
                    {completedCount}/{achievements.length} completed
                </span>
            </div>

            <Separator className="mb-4" />

            <div className="grid grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                    <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        userProgress={progressMap[achievement.id] ?? null}
                    />
                ))}
            </div>
        </section>
    );
}
