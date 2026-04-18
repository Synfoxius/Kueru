"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getChallengeById } from "@/lib/db/challengeService";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    IconArrowLeft,
    IconHeart, IconWorld, IconBolt, IconFlame, IconStar,
    IconTrophy, IconLeaf, IconEgg, IconChefHat, IconSalad,
    IconUsers, IconClock, IconCalendar,
} from "@tabler/icons-react";
import ParticipantsTab from "@/app/challenges/[id]/_components/ParticipantsTab";
import ViewPostsTab from "@/app/challenges/[id]/_components/ViewPostsTab";

// ── Icon map (mirrors challengeService.ICON_NAME_MAP) ─────────────────────────

const ICON_MAP = {
    heart: IconHeart, world: IconWorld, bolt: IconBolt, flame: IconFlame,
    star: IconStar, trophy: IconTrophy, leaf: IconLeaf, egg: IconEgg,
    chef: IconChefHat, salad: IconSalad,
};

function ChallengeIcon({ iconName, className }) {
    const Icon = ICON_MAP[iconName] ?? IconTrophy;
    return <Icon className={className} />;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DIFFICULTY_VARIANT = { easy: "secondary", medium: "outline", hard: "destructive" };
const STATUS_VARIANT     = { active: "default", expired: "outline" };
const TYPE_LABELS        = { individual: "Individual", collective: "Collective" };

const TABS = [
    { key: "participants", label: "Participants" },
    { key: "posts",        label: "Community Posts" },
];

function formatDate(ts) {
    if (!ts) return "—";
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateRange(challenge) {
    return `${formatDate(challenge.startDate)} – ${formatDate(challenge.endDate)}`;
}

function daysRemaining(challenge) {
    const end = challenge.endDate?.toDate?.() ?? new Date(challenge.endDate);
    const diff = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
    if (diff <= 0) return null;
    return diff === 1 ? "1 day remaining" : `${diff} days remaining`;
}

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

function TabBar({ active, onChange }) {
    return (
        <div className="flex gap-2 mb-6">
            {TABS.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onChange(tab.key)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors border ${
                        active === tab.key
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-white text-foreground border-border hover:bg-muted"
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminChallengeDetailPage() {
    const { id: challengeId } = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [activeTab, setActiveTab] = useState("participants");

    const fetchChallenge = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getChallengeById(challengeId);
            if (!data) { setNotFound(true); return; }
            setChallenge(data);
        } finally {
            setLoading(false);
        }
    }, [challengeId]);

    useEffect(() => { fetchChallenge(); }, [fetchChallenge]);

    if (loading) {
        return (
            <div className="p-6">
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (notFound || !challenge) {
        return (
            <div className="p-6">
                <p className="text-sm text-muted-foreground">Challenge not found.</p>
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-1.5"
                    onClick={() => router.push("/admin/challenges")}
                >
                    <IconArrowLeft className="size-4" /> Back to list
                </Button>
            </div>
        );
    }

    const c = challenge;
    const remaining = daysRemaining(c);
    const progressNumerator = c.currentValue ?? 0;
    const progressPercent = c.goalValue > 0
        ? Math.min((progressNumerator / c.goalValue) * 100, 100)
        : 0;

    return (
        <div className="p-6 max-w-3xl">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => router.push("/admin/challenges")}
                    className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <IconArrowLeft className="size-4" /> Back to list
                </button>
                <div className="flex items-start justify-between gap-4">
                    <h1 className="text-2xl font-bold">{c.title}</h1>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary">
                        <ChallengeIcon iconName={c.iconName} className="size-6 text-primary-foreground" />
                    </div>
                </div>
            </div>

            <div className="space-y-4 mb-8">
                {/* Overview card */}
                <Card>
                    <CardContent className="p-5 space-y-3">
                        <SectionHeading>Overview</SectionHeading>
                        <InfoRow label="Description" value={c.description} />
                        <div className="flex gap-2 text-sm">
                            <span className="w-40 shrink-0 font-medium text-muted-foreground">Status</span>
                            <Badge variant={STATUS_VARIANT[c.status] ?? "outline"} className="capitalize">
                                {c.status ?? "—"}
                            </Badge>
                        </div>
                        <div className="flex gap-2 text-sm">
                            <span className="w-40 shrink-0 font-medium text-muted-foreground">Difficulty</span>
                            <Badge variant={DIFFICULTY_VARIANT[c.difficulty] ?? "outline"} className="capitalize">
                                {c.difficulty ?? "—"}
                            </Badge>
                        </div>
                        <InfoRow label="Type"        value={TYPE_LABELS[c.challengeType] ?? c.challengeType} />
                        <InfoRow label="Date Range"  value={formatDateRange(c)} />
                        {remaining && <InfoRow label="Time Left" value={remaining} />}
                        <InfoRow label="Document ID" value={c.id} />
                    </CardContent>
                </Card>

                {/* Community stats */}
                <Card>
                    <CardContent className="p-5 space-y-3">
                        <SectionHeading>Community Stats</SectionHeading>
                        <div className="flex flex-wrap gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <IconUsers className="size-4 text-muted-foreground" />
                                <span className="font-medium">{(c.participantCount ?? 0).toLocaleString()}</span>
                                <span className="text-muted-foreground">participants</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <IconClock className="size-4 text-muted-foreground" />
                                <span className="font-medium">{progressNumerator.toLocaleString()}</span>
                                <span className="text-muted-foreground">/ {(c.goalValue ?? 0).toLocaleString()} goal</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Community Progress</span>
                                <span className="font-semibold text-primary">
                                    {progressNumerator} / {c.goalValue ?? 0}
                                </span>
                            </div>
                            <Progress value={progressPercent} className="h-2.5" />
                        </div>
                    </CardContent>
                </Card>

                {/* Condition */}
                {c.condition && (
                    <Card>
                        <CardContent className="p-5 space-y-3">
                            <SectionHeading>Condition</SectionHeading>
                            <InfoRow label="Type" value={c.condition.type} />
                            {c.condition.value && (
                                <InfoRow label="Value" value={c.condition.value} />
                            )}
                            {c.condition.values?.length > 0 && (
                                <div className="flex gap-2 text-sm">
                                    <span className="w-40 shrink-0 font-medium text-muted-foreground">Values</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {c.condition.values.map((v) => (
                                            <Badge key={v} variant="secondary">{v}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Tabs: Participants + Posts */}
            <TabBar active={activeTab} onChange={setActiveTab} />

            {activeTab === "participants" && (
                <ParticipantsTab
                    challengeId={challengeId}
                    currentUserId={user?.uid ?? null}
                    goalValue={c.goalValue}
                    challengeType={c.challengeType}
                />
            )}
            {activeTab === "posts" && (
                <ViewPostsTab
                    challengeId={challengeId}
                    currentUserId={user?.uid ?? null}
                />
            )}
        </div>
    );
}
