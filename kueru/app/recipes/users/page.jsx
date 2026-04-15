"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { getCertifiedChefs, getPopularUsers } from "@/lib/db/userService";
import { checkIfFollowing, followUser, getFollowing, unfollowUser } from "@/lib/db/followService";
import UserResultsSection from "./_components/UserResultsSection";

const TOP_OPTIONS = [20, 30, 40, 50];
const MODE_OPTIONS = ["chefs", "popular"];

const parseMode = (value) => (MODE_OPTIONS.includes(value) ? value : "popular");
const parseTopCount = (value) => {
    const parsed = Number(value);
    return TOP_OPTIONS.includes(parsed) ? parsed : 20;
};

export default function UsersPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();

    const mode = parseMode(searchParams.get("type"));
    const topCount = parseTopCount(searchParams.get("top"));

    const [users, setUsers] = useState([]);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [followingIds, setFollowingIds] = useState([]);
    const [pendingFollowIds, setPendingFollowIds] = useState([]);

    const requestIdRef = useRef(0);

    const followingIdSet = useMemo(() => new Set(followingIds), [followingIds]);
    const pendingFollowIdSet = useMemo(() => new Set(pendingFollowIds), [pendingFollowIds]);

    const updateQuery = useCallback(
        (nextMode, nextTopCount) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("type", nextMode);
            params.set("top", String(nextTopCount));
            router.replace(`${pathname}?${params.toString()}`);
        },
        [pathname, router, searchParams]
    );

    const refreshFollowingIds = useCallback(async () => {
        if (!user?.uid) {
            setFollowingIds([]);
            return;
        }

        const followRecords = await getFollowing(user.uid);
        const nextIds = [...new Set(followRecords.map((record) => record.followingId).filter(Boolean))];
        setFollowingIds(nextIds);
    }, [user?.uid]);

    const fetchUsers = useCallback(
        async ({ append = false, cursor = null } = {}) => {
            const requestId = ++requestIdRef.current;
            setLoading(true);
            setError("");

            try {
                const fetchFn = mode === "chefs" ? getCertifiedChefs : getPopularUsers;
                const response = await fetchFn(append ? cursor : null, topCount);

                if (requestId !== requestIdRef.current) {
                    return;
                }

                const nextUsers = response.users || [];
                setUsers((previousUsers) => {
                    if (!append) {
                        return nextUsers;
                    }

                    const seen = new Set(previousUsers.map((user) => user.id));
                    const merged = [...previousUsers];
                    nextUsers.forEach((user) => {
                        if (!seen.has(user.id)) {
                            merged.push(user);
                        }
                    });
                    return merged;
                });

                setLastDoc(response.lastDoc || null);
                setHasMore(Boolean(response.lastDoc) && nextUsers.length === topCount);
            } catch (fetchError) {
                if (requestId === requestIdRef.current) {
                    setError(fetchError?.message || "Unable to load users right now.");
                }
            } finally {
                if (requestId === requestIdRef.current) {
                    setLoading(false);
                }
            }
        },
        [mode, topCount]
    );

    const handleBack = useCallback(() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
            return;
        }

        router.push("/recipes/discover");
    }, [router]);

    const handleModeChange = useCallback(
        (nextMode) => {
            updateQuery(nextMode, topCount);
        },
        [topCount, updateQuery]
    );

    const handleTopCountChange = useCallback(
        (nextTopCount) => {
            updateQuery(mode, nextTopCount);
        },
        [mode, updateQuery]
    );

    const handleToggleFollow = useCallback(
        async (targetUserId) => {
            if (!user?.uid || !targetUserId || targetUserId === user.uid || pendingFollowIdSet.has(targetUserId)) {
                return;
            }

            setPendingFollowIds((previousIds) => [...previousIds, targetUserId]);
            setError("");

            try {
                let isCurrentlyFollowing = followingIdSet.has(targetUserId);
                if (!isCurrentlyFollowing) {
                    isCurrentlyFollowing = await checkIfFollowing(user.uid, targetUserId);
                }

                if (isCurrentlyFollowing) {
                    await unfollowUser(user.uid, targetUserId);
                    setFollowingIds((previousIds) => previousIds.filter((id) => id !== targetUserId));
                } else {
                    await followUser(user.uid, targetUserId);
                    setFollowingIds((previousIds) => (previousIds.includes(targetUserId) ? previousIds : [...previousIds, targetUserId]));
                }

                await fetchUsers({ append: false });
            } catch (followError) {
                setError(followError?.message || "Unable to update follow state right now.");
            } finally {
                setPendingFollowIds((previousIds) => previousIds.filter((id) => id !== targetUserId));
            }
        },
        [fetchUsers, followingIdSet, pendingFollowIdSet, user?.uid]
    );

    const handleLoadMore = useCallback(() => {
        fetchUsers({ append: true, cursor: lastDoc });
    }, [fetchUsers, lastDoc]);

    useEffect(() => {
        if (searchParams.get("top")) {
            return;
        }

        updateQuery(mode, topCount);
    }, [mode, searchParams, topCount, updateQuery]);

    useEffect(() => {
        if (authLoading) {
            return;
        }

        refreshFollowingIds().catch(() => {
            setFollowingIds([]);
        });
    }, [authLoading, refreshFollowingIds]);

    useEffect(() => {
        setUsers([]);
        setLastDoc(null);
        setHasMore(false);
        fetchUsers({ append: false });
    }, [fetchUsers, mode, topCount]);

    return (
        <div className="min-h-screen bg-muted/30">
            <Navbar />
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <UserResultsSection
                    mode={mode}
                    topCount={topCount}
                    users={users}
                    loading={loading}
                    error={error}
                    hasMore={hasMore}
                    currentUserId={user?.uid || null}
                    followingIdSet={followingIdSet}
                    pendingFollowIdSet={pendingFollowIdSet}
                    onBack={handleBack}
                    onModeChange={handleModeChange}
                    onTopCountChange={handleTopCountChange}
                    onLoadMore={handleLoadMore}
                    onToggleFollow={handleToggleFollow}
                />
            </main>
        </div>
    );
}
