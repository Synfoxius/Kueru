"use client";

import { Suspense, useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { IconArrowLeft, IconUserPlus, IconUserCheck } from "@tabler/icons-react";
import Link from "next/link";

import { useAuth } from "@/context/AuthContext";
import { getUserByUsername } from "@/lib/db/userService";
import {
    getFollowersWithProfiles,
    getFollowingWithProfiles,
    getFollowing,
    followUser,
    unfollowUser,
} from "@/lib/db/followService";
import { getInitials } from "@/app/profile/_components/getInitials";

import ConditionalNavbar from "@/components/ConditionalNavbar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function UserCard({ u, currentUser, followingSet, onToggle }) {
    const isFollowing = followingSet.has(u.userId);
    const isSelf = currentUser?.uid === u.userId;

    return (
        <div className="flex items-center gap-5 rounded-xl border border-border p-5">
            <Link href={`/profile/${u.username}`} className="shrink-0">
                <Avatar className="size-12 text-base font-bold cursor-pointer">
                    {u.profileImage
                        ? <AvatarImage src={u.profileImage} alt={u.username} />
                        : null}
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                        {getInitials(u.username)}
                    </AvatarFallback>
                </Avatar>
            </Link>

            <Link href={`/profile/${u.username}`} className="flex-1 min-w-0 hover:underline-offset-2">
                <p className="font-semibold text-sm">{u.displayName || u.username}</p>
                <p className="text-xs text-muted-foreground">@{u.username}</p>
                {u.bio && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{u.bio}</p>
                )}
            </Link>

            {currentUser && !isSelf && (
                <Button
                    size="sm"
                    variant={isFollowing ? "outline" : "default"}
                    className="gap-1.5 shrink-0"
                    onClick={() => onToggle(u.userId)}
                >
                    {isFollowing
                        ? <><IconUserCheck className="size-4" /> Following</>
                        : <><IconUserPlus className="size-4" /> Follow</>
                    }
                </Button>
            )}
        </div>
    );
}

function ConnectionsPage() {
    const { username } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user: currentUser, loading: authLoading } = useAuth();

    const initialTab = searchParams.get("tab") === "following" ? "following" : "followers";
    const [tab, setTab] = useState(initialTab);

    const [profileUser, setProfileUser] = useState(null);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [followingSet, setFollowingSet] = useState(new Set());
    const [pageLoading, setPageLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        const load = async () => {
            setPageLoading(true);
            const user = await getUserByUsername(username);
            if (!user) { setNotFound(true); setPageLoading(false); return; }
            setProfileUser(user);

            const [followersData, followingData] = await Promise.all([
                getFollowersWithProfiles(user.userId).catch(() => []),
                getFollowingWithProfiles(user.userId).catch(() => []),
            ]);
            setFollowers(followersData);
            setFollowing(followingData);

            if (currentUser) {
                const myFollowing = await getFollowing(currentUser.uid).catch(() => []);
                setFollowingSet(new Set(myFollowing.map(f => f.followingId)));
            }

            setPageLoading(false);
        };

        load();
    }, [username, authLoading, currentUser]);

    const handleToggle = async (targetUserId) => {
        if (!currentUser) return;
        const isFollowing = followingSet.has(targetUserId);
        // Optimistic update
        setFollowingSet(prev => {
            const next = new Set(prev);
            isFollowing ? next.delete(targetUserId) : next.add(targetUserId);
            return next;
        });
        try {
            if (isFollowing) {
                await unfollowUser(currentUser.uid, targetUserId);
            } else {
                await followUser(currentUser.uid, targetUserId);
            }
        } catch {
            // Revert on failure
            setFollowingSet(prev => {
                const next = new Set(prev);
                isFollowing ? next.add(targetUserId) : next.delete(targetUserId);
                return next;
            });
        }
    };

    if (authLoading || pageLoading) {
        return (
            <>
                <ConditionalNavbar />
                <div className="flex h-[60vh] items-center justify-center text-muted-foreground text-sm">
                    Loading...
                </div>
            </>
        );
    }

    if (notFound) {
        return (
            <>
                <ConditionalNavbar />
                <div className="flex h-[60vh] items-center justify-center text-muted-foreground text-sm">
                    User not found.
                </div>
            </>
        );
    }

    return (
        <>
            <ConditionalNavbar />
            <main className="w-full px-8 sm:px-12 lg:px-20 py-10 space-y-8">
                <div className="flex items-center justify-between gap-8">
                    <h1 className="text-2xl font-bold">Connections</h1>
                    <button
                        onClick={() => router.push(`/profile/${username}`)}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <IconArrowLeft className="size-4" /> Back to Profile
                    </button>
                </div>

                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList variant="line" className="w-full flex gap-0 border-b border-border rounded-none h-auto p-0 mb-6">
                        <TabsTrigger
                            value="followers"
                            className="flex-1 py-3 text-sm font-semibold data-active:bg-transparent data-active:text-primary data-active:border-transparent after:bg-primary"
                        >
                            Followers ({followers.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="following"
                            className="flex-1 py-3 text-sm font-semibold data-active:bg-transparent data-active:text-primary data-active:border-transparent after:bg-primary"
                        >
                            Following ({following.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="followers" className="space-y-4">
                        {followers.length > 0 ? (
                            followers.map(u => (
                                <UserCard
                                    key={u.userId}
                                    u={u}
                                    currentUser={currentUser}
                                    followingSet={followingSet}
                                    onToggle={handleToggle}
                                />
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No followers yet.</p>
                        )}
                    </TabsContent>

                    <TabsContent value="following" className="space-y-4">
                        {following.length > 0 ? (
                            following.map(u => (
                                <UserCard
                                    key={u.userId}
                                    u={u}
                                    currentUser={currentUser}
                                    followingSet={followingSet}
                                    onToggle={handleToggle}
                                />
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">Not following anyone yet.</p>
                        )}
                    </TabsContent>
                </Tabs>
            </main>
        </>
    );
}

export default function Page() {
    return (
        <Suspense fallback={null}>
            <ConnectionsPage />
        </Suspense>
    );
}
