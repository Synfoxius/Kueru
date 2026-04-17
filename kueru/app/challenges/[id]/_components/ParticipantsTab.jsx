"use client";

import { useEffect, useState, useCallback } from "react";
import { getParticipants } from "@/lib/db/challengeService";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function getInitials(username = "") {
    if (!username) return "?";
    const parts = username.trim().split(/\s+/);
    return parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : username.slice(0, 2).toUpperCase();
}

/**
 * "Participants" tab — leaderboard of all challenge participants.
 *
 * Props:
 *   challengeId   string   Firestore challenge document ID
 *   currentUserId string   logged-in user's UID (to highlight "You" row)
 *   goalValue     number   per-user or community goal (used for progress bar)
 *   challengeType string   "individual" | "collective"
 */
export default function ParticipantsTab({ challengeId, currentUserId, goalValue, challengeType }) {
    const [participants, setParticipants] = useState([]);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const loadInitial = useCallback(async () => {
        setLoading(true);
        const result = await getParticipants(challengeId);
        setParticipants(result.participants);
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
        setLoading(false);
    }, [challengeId]);

    useEffect(() => { loadInitial(); }, [loadInitial]);

    const loadMore = async () => {
        if (!lastDoc || loadingMore) return;
        setLoadingMore(true);
        const result = await getParticipants(challengeId, lastDoc);
        setParticipants((prev) => [...prev, ...result.participants]);
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
        setLoadingMore(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                Loading...
            </div>
        );
    }

    if (participants.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                <p className="text-sm">No participants yet. Be the first to join!</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-lg font-bold mb-1">Participants</h2>
            <p className="text-sm text-muted-foreground mb-4">
                See who else is participating in this challenge with you!
            </p>

            <ul className="space-y-2">
                {participants.map((p) => {
                    const isYou = p.userId === currentUserId;
                    const isCollective = challengeType === "collective";
                    const progressPercent = goalValue > 0
                        ? Math.min((p.contribution / goalValue) * 100, 100)
                        : 0;

                    return (
                        <li
                            key={p.userId}
                            className={`flex items-center gap-3 rounded-xl px-4 py-3 bg-white ${isYou ? "border border-primary ring-1 ring-primary/20" : "border border-border"}`}
                        >
                            {/* Avatar */}
                            <Avatar className="size-10 shrink-0">
                                {p.profileImage && <AvatarImage src={p.profileImage} alt={p.username} />}
                                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                                    {getInitials(p.username)}
                                </AvatarFallback>
                            </Avatar>

                            {/* Name + last recipe */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold truncate">
                                        {isYou ? "You" : p.username}
                                    </p>
                                    {isYou && (
                                        <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                                            You
                                        </span>
                                    )}
                                </div>
                                {p.lastRecipeName && (
                                    <p className="text-xs text-muted-foreground truncate">
                                        Last: {p.lastRecipeName}
                                    </p>
                                )}
                            </div>

                            {/* Progress — individual shows X/goal + bar; collective shows contribution count only */}
                            {isCollective ? (
                                <div className="shrink-0 text-right">
                                    <p className="text-xs text-muted-foreground">Contributed</p>
                                    <p className="text-sm font-semibold text-primary">
                                        {p.contribution} {p.contribution === 1 ? "recipe" : "recipes"}
                                    </p>
                                </div>
                            ) : (
                                <div className="w-32 shrink-0 space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Progress</span>
                                        <span className="font-semibold text-primary">
                                            {p.contribution}/{goalValue}
                                        </span>
                                    </div>
                                    <Progress value={progressPercent} className="h-1.5" />
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>

            {hasMore && (
                <div className="mt-4 flex justify-center">
                    <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                        {loadingMore ? "Loading..." : "Load more"}
                    </Button>
                </div>
            )}
        </div>
    );
}
