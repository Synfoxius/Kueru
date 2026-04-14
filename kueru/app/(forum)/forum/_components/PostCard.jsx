"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { getUser } from "@/lib/db/userService";
import { getUserVoteOnTarget, castVote, removeVote } from "@/lib/db/voteService";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { IconArrowUp, IconArrowDown, IconDots, IconMessageCircle, IconFlag, IconEyeOff, IconChefHat, IconPlayerPlay } from "@tabler/icons-react";

function timeAgo(timestamp) {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function PostCard({ post }) {
    const { user } = useAuth();
    const [username, setUsername] = useState(null);
    const [voteCount, setVoteCount] = useState(post.upvotesCount);
    const [userVote, setUserVote] = useState(null);
    
    useEffect(() => {
        if (user) {
            getUserVoteOnTarget(user.uid, post.id).then(setUserVote);
        }
    }, [user, post.id]);

    useEffect(() => {
        if (post.userId) {
            getUser(post.userId).then((u) => { if (u) setUsername(u.username); });
        }
    }, [post.userId]);

    const handleVote = async (value) => {
        if (!user) {
            return;
        }
        if (userVote === value) {
            await removeVote(user.uid, post.id, "post");
            setVoteCount((prev) => prev - value);
            setUserVote(null);
        } else {
            const diff = userVote ? value - userVote : value;
            await castVote(user.uid, post.id, "post", value);
            setVoteCount((prev) => prev + diff);
            setUserVote(value);
        }
    };

    const image = post.imageURLs?.[0] ?? null;
    const postType = post.postType ?? "Discussion";

    const displayTags = postType === "Discussion"
        ? (post.postCategory ? [post.postCategory] : [])
        : (post.tags ?? []);

    return (
        <Card className="w-full bg-white py-0 relative">
            <CardContent className="flex gap-0 p-0 overflow-hidden">

                {/* Vote column */}
                <div
                    className="flex flex-col items-center justify-center gap-1 shrink-0 w-14 self-stretch"
                    style={{ backgroundColor: "#f9f5f3" }}
                >
                    <button
                        onClick={() => handleVote(1)}
                        className={`transition-colors ${userVote === 1 ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                    >
                        <IconArrowUp className="size-5" />
                    </button>
                    <span className="text-sm font-semibold tabular-nums">{voteCount}</span>
                    <button
                        onClick={() => handleVote(-1)}
                        className={`transition-colors ${userVote === -1 ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}
                    >
                        <IconArrowDown className="size-5" />
                    </button>
                </div>

                <Separator orientation="vertical" className="h-auto" />

                {/* Content */}
                <div className="flex flex-1 flex-col gap-1 min-w-0 p-4 pr-10">

                    {/* Title */}
                    <Link href={`/forum/${post.id}`} className="font-semibold text-foreground hover:underline line-clamp-2">
                        {post.title}
                    </Link>

                    {/* Body preview */}
                    {post.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                    )}

                    {/* Tags */}
                    {displayTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {displayTags.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Video badge */}
                    {post.videoEmbed && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-muted text-xs text-muted-foreground font-medium w-fit">
                            <IconPlayerPlay className="size-3.5 shrink-0" />
                            {post.videoEmbed.platform === "youtube" ? "YouTube" : "Vimeo"} video
                        </span>
                    )}

                    {/* Recipe link */}
                    {post.postType === "Recipe" && post.recipeId && (
                        <Link
                            href={`/recipe/${post.recipeId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-primary/30 bg-primary/5 text-xs text-primary font-medium hover:bg-primary/10 transition-colors w-fit"
                        >
                            <IconChefHat className="size-3.5 shrink-0" />
                            View Recipe
                        </Link>
                    )}

                    {/* Meta */}
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Posted by <Link href={`/profile/${username ?? post.userId}`} className="text-primary hover:underline">@{username ?? post.userId}</Link></span>
                        <span>·</span>
                        <span>{timeAgo(post.postedDateTime)}</span>
                        <span>·</span>
                        <Link href={`/forum/${post.id}#comments`} className="flex items-center gap-1 text-primary hover:underline">
                            <IconMessageCircle className="size-3" />
                            {post.commentsCount} comments
                        </Link>
                    </div>

                </div>

                {/* Thumbnail image */}
                {image && (
                    <div className="flex items-center pr-4">
                        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg">
                            <Image src={image} alt={post.title} fill sizes="80px" className="object-cover" />
                        </div>
                    </div>
                )}

            </CardContent>

            {/* "..." dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
                        <IconDots className="size-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2">
                        <IconFlag className="size-4" /> Report
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                        <IconEyeOff className="size-4" /> Hide
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </Card>
    );
}
