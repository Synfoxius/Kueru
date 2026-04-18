"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAchievementById } from "@/lib/db/achievementService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { IconArrowLeft, IconTrophy, IconFlame, IconWorld, IconMedal, IconStar } from "@tabler/icons-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const CATEGORY_ICON = {
    "Cooking Streaks": IconFlame,
    "Exploration":     IconWorld,
    "Skill Badges":    IconMedal,
    "Milestones":      IconStar,
};

const TRACKING_LABELS = {
    streak:      "Streak",
    count:       "Count",
    exact_match: "Exact Match",
};

function SectionHeading({ children }) {
    return (
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {children}
        </p>
    );
}

function InfoRow({ label, value }) {
    if (value == null || value === "") return null;
    return (
        <div className="flex gap-2 text-sm">
            <span className="w-40 shrink-0 font-medium text-muted-foreground">{label}</span>
            <span className="break-all">{value}</span>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminAchievementDetailPage() {
    const { id: achievementId } = useParams();
    const router = useRouter();

    const [achievement, setAchievement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const fetchAchievement = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAchievementById(achievementId);
            if (!data) { setNotFound(true); return; }
            setAchievement(data);
        } finally {
            setLoading(false);
        }
    }, [achievementId]);

    useEffect(() => { fetchAchievement(); }, [fetchAchievement]);

    if (loading) {
        return (
            <div className="p-6">
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (notFound || !achievement) {
        return (
            <div className="p-6">
                <p className="text-sm text-muted-foreground">Achievement not found.</p>
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-1.5"
                    onClick={() => router.push("/admin/achievements")}
                >
                    <IconArrowLeft className="size-4" /> Back to list
                </Button>
            </div>
        );
    }

    const a = achievement;
    const CategoryIcon = CATEGORY_ICON[a.category] ?? IconTrophy;

    return (
        <div className="p-6 max-w-3xl">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.push("/admin/achievements")}
                        className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <IconArrowLeft className="size-4" /> Back to list
                    </button>
                    <h1 className="text-2xl font-bold">{a.title}</h1>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary">
                    <CategoryIcon className="size-6 text-primary-foreground" />
                </div>
            </div>

            <div className="space-y-4">
                {/* Core info */}
                <Card>
                    <CardContent className="p-5 space-y-3">
                        <SectionHeading>Achievement Definition</SectionHeading>
                        <InfoRow label="Title"       value={a.title} />
                        <InfoRow label="Description" value={a.description} />
                        <InfoRow label="Category"    value={a.category} />
                        <div className="flex gap-2 text-sm">
                            <span className="w-40 shrink-0 font-medium text-muted-foreground">Tracking Type</span>
                            <Badge variant="outline">
                                {TRACKING_LABELS[a.trackingType] ?? a.trackingType ?? "—"}
                            </Badge>
                        </div>
                        <InfoRow
                            label="Goal"
                            value={
                                a.goalValue != null
                                    ? `${a.goalValue}${a.unit ? ` ${a.unit}` : ""}`
                                    : null
                            }
                        />
                        <InfoRow label="Unit"   value={a.unit} />
                    </CardContent>
                </Card>

                {/* Condition */}
                {a.condition && (
                    <Card>
                        <CardContent className="p-5 space-y-3">
                            <SectionHeading>Condition</SectionHeading>
                            <InfoRow label="Type" value={a.condition.type} />
                            {a.condition.value && (
                                <InfoRow label="Value" value={a.condition.value} />
                            )}
                            {a.condition.values?.length > 0 && (
                                <div className="flex gap-2 text-sm">
                                    <span className="w-40 shrink-0 font-medium text-muted-foreground">Values</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {a.condition.values.map((v) => (
                                            <Badge key={v} variant="secondary">{v}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Icon / asset */}
                {a.iconURL && (
                    <Card>
                        <CardContent className="p-5 space-y-3">
                            <SectionHeading>Asset</SectionHeading>
                            <InfoRow label="Icon URL" value={a.iconURL} />
                        </CardContent>
                    </Card>
                )}

                {/* Document ID */}
                <Card>
                    <CardContent className="p-5 space-y-1.5">
                        <SectionHeading>Metadata</SectionHeading>
                        <InfoRow label="Document ID" value={a.id} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
