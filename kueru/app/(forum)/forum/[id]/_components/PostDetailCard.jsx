"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUser } from "@/lib/db/userService";
import { getUserVoteOnTarget, castVote, removeVote } from "@/lib/db/voteService";
import { IconArrowUp, IconArrowDown, IconMessageCircle, IconChefHat, IconPlayerPlay } from "@tabler/icons-react";
import ImageGallery from "./ImageGallery";

function timeAgo(timestamp) {
    if (!timestamp) { return ""; }
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) { return "just now"; }
    if (diff < 3600) { return `${Math.floor(diff / 60)}m ago`; }
    if (diff < 86400) { return `${Math.floor(diff / 3600)}h ago`; }
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function PostDetailCard({ post }) {
    const { user } = useAuth();
    const [postAuthor, setPostAuthor] = useState(null);
    const [voteCount, setVoteCount] = useState(post.upvotesCount ?? 0);
    const [userVote, setUserVote] = useState(null);

    useEffect(() => {
        if (post.userId) {
            getUser(post.userId).then(setPostAuthor);
        }
    }, [post.userId]);

    useEffect(() => {
        if (user) {
            getUserVoteOnTarget(user.uid, post.id).then(setUserVote);
        }
    }, [user, post.id]);

    const handleVote = async (value) => {
        if (!user) { return; }
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

    const tags = post.postType === "Discussion"
        ? (post.postCategory ? [post.postCategory] : [])
        : (post.tags ?? []);

    return (
        <div className="rounded-xl border-l-4 border-l-primary border border-border bg-white shadow-sm overflow-hidden">


            {/* Post body */}
            <div className="p-6 flex gap-4">

                {/* Vote column */}
                <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                    <button
                        onClick={() => handleVote(1)}
                        className={`p-1.5 rounded-lg transition-colors ${userVote === 1 ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10"}`}
                    >
                        <IconArrowUp className="size-5" />
                    </button>
                    <span className="text-sm font-bold tabular-nums">{voteCount}</span>
                    <button
                        onClick={() => handleVote(-1)}
                        className={`p-1.5 rounded-lg transition-colors ${userVote === -1 ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"}`}
                    >
                        <IconArrowDown className="size-5" />
                    </button>
                </div>

                {/* Post content */}
                <div className="flex-1 min-w-0 flex flex-col gap-3">

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {tags.map((tag) => (
                                <span key={tag} className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Title */}
                    <h1 className="text-xl font-bold text-foreground leading-snug">{post.title}</h1>

                    {/* Meta */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                            Posted by{" "}
                            <Link
                                href={`/profile/${postAuthor?.username ?? post.userId}`}
                                className="text-primary font-medium hover:underline"
                            >
                                @{postAuthor?.username ?? post.userId}
                            </Link>
                        </span>
                        <span>·</span>
                        <span>{timeAgo(post.postedDateTime)}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                            <IconMessageCircle className="size-3" />
                            {post.commentsCount} comments
                        </span>
                    </div>

                    {/* Body text */}
                    {post.content && (
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    )}

                    {/* Recipe link */}
                    {post.postType === "Recipe" && post.recipeId && (
                        <Link
                            href={`/recipe/${post.recipeId}`}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/30 bg-primary/5 text-sm text-primary font-medium hover:bg-primary/10 transition-colors w-fit"
                        >
                            <IconChefHat className="size-4 shrink-0" />
                            View Recipe
                        </Link>
                    )}

                    {/* Video embed */}
                    {post.videoEmbed && (
                        <div className="rounded-xl overflow-hidden border border-border aspect-video">
                            <iframe
                                src={
                                    post.videoEmbed.platform === "youtube"
                                        ? `https://www.youtube.com/embed/${post.videoEmbed.id}`
                                        : `https://player.vimeo.com/video/${post.videoEmbed.id}`
                                }
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    )}

                    {/* Image gallery */}
                    {post.imageURLs?.length > 0 && (
                        <ImageGallery images={post.imageURLs} title={post.title} />
                    )}

                </div>
                {/* End post content */}

            </div>
            {/* End post body */}

        </div>
    );
}
