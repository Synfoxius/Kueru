"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    IconArrowLeft, IconUsers, IconClock, IconCalendar,
    IconHeart, IconWorld, IconBolt, IconFlame, IconStar,
    IconTrophy, IconLeaf, IconEgg, IconChefHat, IconSalad,
} from "@tabler/icons-react";

import { useAuth } from "@/context/AuthContext";
import { getChallengeById, getUserChallenge, joinChallenge } from "@/lib/db/challengeService";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import MyProgressTab from "./_components/MyProgressTab";
import ParticipantsTab from "./_components/ParticipantsTab";
import ViewPostsTab from "./_components/ViewPostsTab";

// ── Icon map ──────────────────────────────────────────────────────────────────

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

function isActive(challenge) {
    if (!challenge) return false;
    const now = Date.now();
    const end = challenge.endDate?.toDate?.() ?? new Date(challenge.endDate);
    const start = challenge.startDate?.toDate?.() ?? new Date(challenge.startDate);
    return now >= start.getTime() && now <= end.getTime();
}

function daysRemaining(challenge) {
    const end = challenge.endDate?.toDate?.() ?? new Date(challenge.endDate);
    const diff = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
    if (diff <= 0) return null;
    return diff === 1 ? "1 day remaining" : `${diff} days remaining`;
}

function formatDateRange(challenge) {
    const opts = { day: "numeric", month: "short", year: "numeric" };
    const start = (challenge.startDate?.toDate?.() ?? new Date(challenge.startDate))
        .toLocaleDateString("en-US", opts);
    const end = (challenge.endDate?.toDate?.() ?? new Date(challenge.endDate))
        .toLocaleDateString("en-US", opts);
    return `${start} - ${end}`;
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

const TABS = [
    { key: "progress",     label: "My Progress" },
    { key: "participants", label: "Participants" },
    { key: "posts",        label: "View Posts" },
];

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

export default function ChallengeDetailPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { id: challengeId } = useParams();

    const [challenge, setChallenge] = useState(null);
    const [userChallenge, setUserChallenge] = useState(null); // null = not joined
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("progress");
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) router.replace("/login");
    }, [authLoading, user, router]);

    const load = useCallback(async () => {
        if (!user || !challengeId) return;
        setLoading(true);
        const [c, uc] = await Promise.all([
            getChallengeById(challengeId),
            getUserChallenge(user.uid, challengeId),
        ]);
        setChallenge(c);
        setUserChallenge(uc);
        setLoading(false);
    }, [user, challengeId]);

    useEffect(() => { load(); }, [load]);

    const handleJoin = async () => {
        setJoining(true);
        const joined = await joinChallenge(user.uid, challengeId);
        if (joined) {
            setUserChallenge({ challengeId, contribution: 0, joinedAt: new Date(), completed: false, linkedRecipeIds: [] });
            setChallenge((prev) => prev ? { ...prev, participantCount: (prev.participantCount ?? 0) + 1 } : prev);
        }
        setJoining(false);
    };

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

    if (!challenge) {
        return (
            <div className="min-h-screen bg-muted/30">
                <Navbar />
                <main className="mx-auto max-w-3xl px-4 py-8">
                    <p className="text-sm text-muted-foreground">Challenge not found.</p>
                </main>
            </div>
        );
    }

    const active = isActive(challenge);
    const joined = !!userChallenge;
    const remaining = daysRemaining(challenge);

    // Progress display:
    // - individual: user's contribution vs goalValue
    // - collective:  community currentValue vs goalValue
    const progressNumerator = challenge.challengeType === "collective"
        ? (challenge.currentValue ?? 0)
        : (userChallenge?.contribution ?? 0);
    const progressPercent = challenge.goalValue > 0
        ? Math.min((progressNumerator / challenge.goalValue) * 100, 100)
        : 0;

    return (
        <div className="min-h-screen bg-muted/30">
            <Navbar />
            <main className="mx-auto max-w-3xl px-4 py-8">
                {/* Back link */}
                <Link
                    href="/challenges"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                    <IconArrowLeft className="size-4" />
                    Back to Challenges
                </Link>

                {/* Header card */}
                <Card className={`mb-6 bg-white ${joined ? "border-primary ring-1 ring-primary/30" : ""}`}>
                    <CardContent className="p-6 space-y-4">
                        {/* Time badge + title row */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <h1 className="text-2xl font-bold leading-tight">{challenge.title}</h1>
                                <p className="text-sm text-muted-foreground">{challenge.description}</p>
                            </div>
                            {remaining && (
                                <span className="shrink-0 rounded-md bg-amber-500 px-3 py-1 text-xs font-semibold text-white whitespace-nowrap">
                                    {remaining}
                                </span>
                            )}
                            {!remaining && (
                                <span className="shrink-0 rounded-md bg-muted px-3 py-1 text-xs font-medium text-muted-foreground whitespace-nowrap">
                                    Ended
                                </span>
                            )}
                        </div>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <IconUsers className="size-3.5" />
                                {(challenge.participantCount ?? 0).toLocaleString()} participants
                            </span>
                            <span className="flex items-center gap-1.5">
                                <IconClock className="size-3.5" />
                                {challenge.difficulty}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <IconCalendar className="size-3.5" />
                                {formatDateRange(challenge)}
                            </span>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    {challenge.challengeType === "collective" ? "Community Progress" : "Your Progress"}
                                </span>
                                <span className="font-semibold text-primary">
                                    {progressNumerator}/{challenge.goalValue}
                                </span>
                            </div>
                            <Progress value={progressPercent} className="h-2.5" />
                        </div>

                        {/* Join button (active, not joined) */}
                        {active && !joined && (
                            <Button className="w-full" onClick={handleJoin} disabled={joining}>
                                {joining ? "Joining..." : "Join Challenge"}
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Tab bar */}
                <TabBar active={activeTab} onChange={setActiveTab} />

                {/* Tab content */}
                {activeTab === "progress" && (
                    <MyProgressTab
                        linkedRecipeIds={userChallenge?.linkedRecipeIds ?? []}
                        joined={joined}
                        active={active}
                    />
                )}
                {activeTab === "participants" && (
                    <ParticipantsTab
                        challengeId={challengeId}
                        currentUserId={user.uid}
                        goalValue={challenge.goalValue}
                        challengeType={challenge.challengeType}
                    />
                )}
                {activeTab === "posts" && (
                    <ViewPostsTab
                        challengeId={challengeId}
                        currentUserId={user.uid}
                    />
                )}
            </main>
        </div>
    );
}
