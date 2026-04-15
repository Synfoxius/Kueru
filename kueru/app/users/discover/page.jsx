"use client";

import { useState, useEffect, useRef } from "react";
import { IconSearch, IconUserPlus, IconUserCheck, IconChefHat } from "@tabler/icons-react";
import Link from "next/link";

import { useAuth } from "@/context/AuthContext";
import { searchUsers } from "@/lib/db/userService";
import { getFollowing, followUser, unfollowUser } from "@/lib/db/followService";
import { getInitials } from "@/app/profile/_components/getInitials";

import ConditionalNavbar from "@/components/ConditionalNavbar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function UserCard({ u, currentUser, followingSet, onToggle }) {
    const isFollowing = followingSet.has(u.userId);
    const isSelf = currentUser?.uid === u.userId;

    return (
        <div className="flex items-center gap-5 rounded-xl border border-border p-5">
            <Link href={`/profile/${u.username}`} className="relative shrink-0">
                <Avatar className="size-14 text-lg font-bold">
                    {u.profileImage
                        ? <AvatarImage src={u.profileImage} alt={u.username} />
                        : null}
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                        {getInitials(u.username)}
                    </AvatarFallback>
                </Avatar>
                {u.role === 'chef' && (
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-amber-500 p-1 shadow">
                        <IconChefHat className="size-3 text-white" />
                    </div>
                )}
            </Link>

            <Link href={`/profile/${u.username}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm">{u.displayName || u.username}</p>
                    {u.role === 'chef' && (
                        <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded font-semibold">CHEF</span>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">@{u.username}</p>
                {u.bio && (
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">{u.bio}</p>
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

export default function DiscoverUsersPage() {
    const { user: currentUser, loading: authLoading } = useAuth();

    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [followingSet, setFollowingSet] = useState(new Set());

    const debounceRef = useRef(null);

    // Seed followingSet once authenticated
    useEffect(() => {
        if (!currentUser) { setFollowingSet(new Set()); return; }
        getFollowing(currentUser.uid)
            .then(follows => setFollowingSet(new Set(follows.map(f => f.followingId))))
            .catch(() => {});
    }, [currentUser]);

    // Search on term/filter change (debounced) — only when term is non-empty
    useEffect(() => {
        if (authLoading) return;
        if (!searchTerm.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            const users = await searchUsers(searchTerm).catch(() => []);
            setResults(users);
            setLoading(false);
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [searchTerm, authLoading]);

    const handleToggle = async (targetUserId) => {
        if (!currentUser) return;
        const isFollowing = followingSet.has(targetUserId);
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
            setFollowingSet(prev => {
                const next = new Set(prev);
                isFollowing ? next.add(targetUserId) : next.delete(targetUserId);
                return next;
            });
        }
    };

    return (
        <>
            <ConditionalNavbar />
            <main className="w-full px-8 sm:px-12 lg:px-20 py-10 space-y-6">
                <h1 className="text-2xl font-bold">Discover Users</h1>

                {/* Search bar */}
                <div className="relative">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by username..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Results */}
                {!searchTerm.trim() ? (
                    <p className="text-sm text-muted-foreground">Type a username to search for users.</p>
                ) : loading ? (
                    <p className="text-sm text-muted-foreground">Searching...</p>
                ) : (
                    <>
                        <p className="text-sm text-muted-foreground">
                            {results.length} {results.length === 1 ? "user" : "users"} found
                        </p>
                        <div className="space-y-3">
                            {results.map(u => (
                                <UserCard
                                    key={u.userId}
                                    u={u}
                                    currentUser={currentUser}
                                    followingSet={followingSet}
                                    onToggle={handleToggle}
                                />
                            ))}
                        </div>
                        {results.length === 0 && (
                            <p className="text-sm text-muted-foreground">No users found.</p>
                        )}
                    </>
                )}
            </main>
        </>
    );
}
