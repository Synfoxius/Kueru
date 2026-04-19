"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    IconUsers, IconClock, IconHeart, IconWorld, IconBolt, IconFlame,
    IconStar, IconTrophy, IconLeaf, IconEgg, IconChefHat, IconSalad,
} from "@tabler/icons-react";

import { useAuth } from "@/context/AuthContext";
import { getAllChallenges, getUserChallenges, joinChallenge } from "@/lib/db/challengeService";
import Navbar from "@/components/Navbar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// ── Icon map ──────────────────────────────────────────────────────────────────

const ICON_MAP = {
    heart:   IconHeart,
    world:   IconWorld,
    bolt:    IconBolt,
    flame:   IconFlame,
    star:    IconStar,
    trophy:  IconTrophy,
    leaf:    IconLeaf,
    egg:     IconEgg,
    chef:    IconChefHat,
    salad:   IconSalad,
};

function ChallengeIcon({ iconName, className }) {
    const Icon = ICON_MAP[iconName] ?? IconTrophy;
    return <Icon className={className} />;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isActive(challenge) {
    if (challenge.status === "expired") return false;
    const now = Date.now();
    const end = challenge.endDate?.toDate?.() ?? new Date(challenge.endDate);
    const start = challenge.startDate?.toDate?.() ?? new Date(challenge.startDate);
    return now >= start.getTime() && now <= end.getTime();
}

function daysLeft(challenge) {
    const end = challenge.endDate?.toDate?.() ?? new Date(challenge.endDate);
    const diff = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
    if (diff <= 0) return "Ended";
    if (diff === 1) return "1d left";
    return `${diff}d left`;
}

// ── Challenge Card ────────────────────────────────────────────────────────────

function ChallengeCard({ challenge, userChallenge, onJoin, joiningId }) {
    const active = isActive(challenge);
    const joined = !!userChallenge;
    const timeLabel = daysLeft(challenge);
    const ended = !active;

    const userContribution = userChallenge?.contribution ?? 0;
    const progressValue = challenge.goalValue > 0
        ? Math.min((userContribution / challenge.goalValue) * 100, 100)
        : 0;

    return (
        <Card className={`transition-colors bg-white ${joined && active ? "border-primary ring-1 ring-primary/30" : ""} ${ended ? "opacity-60" : ""}`}>
            <CardContent className="p-5 flex flex-col gap-4">
                {/* Header row */}
                <div className="flex items-start gap-3">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${joined ? "bg-primary" : "bg-muted"}`}>
                        <ChallengeIcon
                            iconName={challenge.iconName}
                            className={`size-6 ${joined ? "text-primary-foreground" : "text-muted-foreground"}`}
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <Link href={`/challenges/${challenge.id}`} className="font-semibold text-sm leading-snug hover:underline">
                                {challenge.title}
                            </Link>
                            {active ? (
                                <span className="shrink-0 rounded-md bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white whitespace-nowrap">
                                    {timeLabel}
                                </span>
                            ) : (
                                <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                                    Ended
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{challenge.description}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <IconUsers className="size-3.5" />
                                {(challenge.participantCount ?? 0).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                                <IconClock className="size-3.5" />
                                {challenge.difficulty}
                            </span>
                            {challenge.challengeType === "collective" && (
                                <span className="flex items-center gap-1">
                                    <IconUsers className="size-3.5" />
                                    Collaborative
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Progress (joined challenges only) */}
                {joined && (
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Your Progress</span>
                            <span className="font-semibold text-primary">
                                {userContribution}/{challenge.goalValue}
                            </span>
                        </div>
                        <Progress value={progressValue} className="h-2" />
                    </div>
                )}

                {/* Action buttons */}
                {joined ? (
                    <Button asChild variant="outline" className="w-full text-sm">
                        <Link href={`/challenges/${challenge.id}`}>View Progress</Link>
                    </Button>
                ) : active ? (
                    <div className="flex gap-2">
                        <Button asChild variant="outline" className="flex-1 text-sm">
                            <Link href={`/challenges/${challenge.id}`}>View Details</Link>
                        </Button>
                        <Button
                            className="flex-1 text-sm"
                            onClick={() => onJoin(challenge.id)}
                            disabled={joiningId === challenge.id}
                        >
                            {joiningId === challenge.id ? "Joining..." : "Join"}
                        </Button>
                    </div>
                ) : (
                    <Button asChild variant="outline" className="w-full text-sm">
                        <Link href={`/challenges/${challenge.id}`}>View Details</Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS = [
    { key: "all",       label: "All Challenges" },
    { key: "my",        label: "My Active" },
    { key: "available", label: "Available" },
];

export default function ChallengesPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [challenges, setChallenges] = useState([]);
    const [ucMap, setUcMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [joiningId, setJoiningId] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) router.replace("/login");
    }, [authLoading, user, router]);

    // Fetch all challenges immediately — doesn't need auth
    useEffect(() => {
        getAllChallenges()
            .then(setChallenges)
            .finally(() => setLoading(false));
    }, []);

    // Fetch user's joined challenges separately after auth resolves
    useEffect(() => {
        if (!user) return;
        getUserChallenges(user.uid).then((ucs) => {
            setUcMap(Object.fromEntries(ucs.map((uc) => [uc.challengeId ?? uc.id, uc])));
        });
    }, [user]);

    const handleJoin = async (challengeId) => {
        setJoiningId(challengeId);
        const joined = await joinChallenge(user.uid, challengeId);
        if (joined) {
            setUcMap((prev) => ({
                ...prev,
                [challengeId]: { challengeId, contribution: 0, joinedAt: new Date(), completed: false, linkedRecipeIds: [] },
            }));
            setChallenges((prev) =>
                prev.map((c) =>
                    c.id === challengeId
                        ? { ...c, participantCount: (c.participantCount ?? 0) + 1 }
                        : c
                )
            );
        }
        setJoiningId(null);
    };

    const filteredChallenges = challenges.filter((c) => {
        if (!isActive(c)) return false;
        const joined = !!ucMap[c.id];
        if (activeTab === "my") return joined;
        if (activeTab === "available") return !joined;
        return true;
    });

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-muted/30">
                <Navbar />
                <main className="mx-auto max-w-5xl px-4 py-8">
                    <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                        Loading...
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30">
            <Navbar />
            <main className="mx-auto max-w-5xl px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Challenges</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Collaborate with the community! Unlike achievements, challenges are only available within certain dates.
                    </p>
                </div>

                <div className="flex gap-2 mb-6">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors border ${
                                activeTab === tab.key
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-white text-foreground border-border hover:bg-muted"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {filteredChallenges.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-12 text-center">
                        {activeTab === "my"
                            ? "You haven't joined any active challenges yet."
                            : activeTab === "available"
                            ? "No available challenges to join right now."
                            : "No challenges found."}
                    </p>
                ) : (
                    <div className="space-y-8">
                        {[
                            { key: "individual", label: "Individual Challenges", description: "Work toward your own goal." },
                            { key: "collective", label: "Collaborative Challenges", description: "Contribute to a shared community goal." },
                        ].map(({ key, label, description }) => {
                            const group = filteredChallenges.filter(
                                (c) => (c.challengeType ?? "individual") === key
                            );
                            if (group.length === 0) return null;
                            return (
                                <section key={key}>
                                    <div className="mb-3">
                                        <h2 className="text-lg font-semibold">{label}</h2>
                                        <p className="text-xs text-muted-foreground">{description}</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {group.map((challenge) => (
                                            <ChallengeCard
                                                key={challenge.id}
                                                challenge={challenge}
                                                userChallenge={ucMap[challenge.id] ?? null}
                                                onJoin={handleJoin}
                                                joiningId={joiningId}
                                            />
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
