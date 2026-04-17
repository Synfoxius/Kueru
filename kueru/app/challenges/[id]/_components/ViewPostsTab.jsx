"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getCommunityPosts } from "@/lib/db/challengeService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconHeart, IconMessageCircle } from "@tabler/icons-react";

function getInitials(username = "") {
    if (!username) return "?";
    const parts = username.trim().split(/\s+/);
    return parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : username.slice(0, 2).toUpperCase();
}

function formatDate(timestamp) {
    if (!timestamp) return "";
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function PostCard({ post, currentUserId }) {
    const isYou = post.userId === currentUserId;

    return (
        <Card className="bg-white overflow-hidden flex flex-col">
            {/* Recipe image */}
            <div className="aspect-[4/3] w-full bg-muted overflow-hidden">
                {post.imageURL ? (
                    <img
                        src={post.imageURL}
                        alt={post.recipeName}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No image
                    </div>
                )}
            </div>

            <CardContent className="p-3 flex flex-col gap-2 flex-1">
                {/* Author */}
                <div className="flex items-center gap-2">
                    <Avatar className="size-7 shrink-0">
                        {post.profileImage && <AvatarImage src={post.profileImage} alt={post.username} />}
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                            {getInitials(post.username)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-medium truncate">{isYou ? "You" : post.username}</span>
                        {isYou && (
                            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground whitespace-nowrap">
                                You
                            </span>
                        )}
                    </div>
                </div>

                {/* Recipe name + date */}
                <div>
                    <p className="text-sm font-semibold line-clamp-2 leading-snug">{post.recipeName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(post.createdAt)}</p>
                </div>

                {/* Stats */}
                <div className="flex gap-2 mt-auto">
                    <div className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">
                        <IconHeart className="size-3.5" />
                        {post.upvotes ?? 0}
                    </div>
                    <div className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">
                        <IconMessageCircle className="size-3.5" />
                        {post.commentCount ?? 0}
                    </div>
                </div>

                {/* View button */}
                <Button asChild variant="outline" size="sm" className="w-full text-primary border-primary hover:bg-primary/5">
                    <Link href={`/recipes/${post.recipeId}`}>View Full Post</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

/**
 * "View Posts" tab — community posts grid showing all participants' contributions.
 *
 * Props:
 *   challengeId   string   Firestore challenge document ID
 *   currentUserId string   logged-in user's UID (for "You" badge)
 */
export default function ViewPostsTab({ challengeId, currentUserId }) {
    const [posts, setPosts] = useState([]);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const loadInitial = useCallback(async () => {
        setLoading(true);
        const result = await getCommunityPosts(challengeId);
        setPosts(result.posts);
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
        setLoading(false);
    }, [challengeId]);

    useEffect(() => { loadInitial(); }, [loadInitial]);

    const loadMore = async () => {
        if (!lastDoc || loadingMore) return;
        setLoadingMore(true);
        const result = await getCommunityPosts(challengeId, lastDoc);
        setPosts((prev) => [...prev, ...result.posts]);
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

    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                <p className="text-sm">No community posts yet. Be the first to contribute!</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-lg font-bold mb-1">Community Posts</h2>
            <p className="text-sm text-muted-foreground mb-4">
                Browse and engage with posts from all participants
            </p>

            <div className="grid grid-cols-3 gap-4">
                {posts.map((post) => (
                    <PostCard key={post.id} post={post} currentUserId={currentUserId} />
                ))}
            </div>

            {hasMore && (
                <div className="mt-6 flex justify-center">
                    <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                        {loadingMore ? "Loading..." : "Load more"}
                    </Button>
                </div>
            )}
        </div>
    );
}
