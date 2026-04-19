"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { getUser, hidePost, unhidePost, savePost, unsavePost } from "@/lib/db/userService";
import { getUserVoteOnTarget, castVote, removeVote } from "@/lib/db/voteService";
import { deletePost } from "@/lib/db/forumService";
import { getRecipe } from "@/lib/db/recipeService";
import { createReport, hasUserReported } from "@/lib/db/reportService";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { IconArrowUp, IconArrowDown, IconDots, IconMessageCircle, IconFlag, IconEyeOff, IconChefHat, IconPlayerPlay, IconTrash, IconPencil, IconBookmark, IconBookmarkFilled } from "@tabler/icons-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import ReportDialog from "@/components/ReportDialog";
import { toast } from "sonner";

function timeAgo(timestamp) {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function PostCard({ post, onDeleted, isHidden = false, onHidden, onUnhidden, onSaved, onUnsaved }) {
    const { user } = useAuth();
    const router = useRouter();
    const [username, setUsername] = useState(null);
    const [voteCount, setVoteCount] = useState(post.upvotesCount);
    const [userVote, setUserVote] = useState(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [recipeTags, setRecipeTags] = useState([]);
    const [recipeDeleted, setRecipeDeleted] = useState(false);
    const [hasReported, setHasReported] = useState(false);

    const handleDelete = async () => {
        await deletePost(post.id);
        setShowDeleteDialog(false);
        toast.success("Post deleted.");
        if (onDeleted) { onDeleted(post.id); }
    };
    
    useEffect(() => {
        if (user) {
            getUserVoteOnTarget(user.uid, post.id).then(setUserVote);
        }
    }, [user, post.id]);

    useEffect(() => {
        if (user) {
            getUser(user.uid).then((u) => {
                setIsSaved(u?.savedPosts?.includes(post.id) ?? false);
            });
        }
    }, [user, post.id]);

    useEffect(() => {
        if (post.userId) {
            getUser(post.userId).then((u) => { if (u) setUsername(u.username); });
        }
    }, [post.userId]);

    useEffect(() => {
        if (user) {
            hasUserReported(post.id, user.uid).then(setHasReported);
        }
    }, [user, post.id]);

    useEffect(() => {
        if (post.postType === "Recipe" && post.recipeId) {
            getRecipe(post.recipeId).then((r) => {
                if (!r || r.status === "deleted") {
                    setRecipeDeleted(true);
                } else if (r.tags) {
                    setRecipeTags(r.tags);
                }
            });
        }
    }, [post.postType, post.recipeId]);

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
        : recipeTags;

    const handleSave = async () => {
        if (!user) { return; }
        if (isSaved) {
            await unsavePost(user.uid, post.id);
            setIsSaved(false);
            if (onUnsaved) { onUnsaved(post.id); }
            toast.success("Post unsaved.");
        } else {
            await savePost(user.uid, post.id);
            setIsSaved(true);
            if (onSaved) { onSaved(post); }
            toast.success("Post saved.");
        }
    };

    const handleReport = async (reason, details) => {
        try {
            await createReport(post.id, "post", user.uid, reason, details);
            setShowReportDialog(false);
            setHasReported(true);
            toast.success("Post reported. Our moderators will review it.");
        } catch (e) {
            if (e.message === "already_reported") {
                setShowReportDialog(false);
                toast.error("You have already reported this post.");
            }
        }
    };

    const handleHide = async () => {
        if (user) { await hidePost(user.uid, post.id); }
        if (onHidden) { onHidden(post.id); }
        toast.success("Post hidden.");
    };

    const handleUnhide = async () => {
        if (user) { await unhidePost(user.uid, post.id); }
        if (onUnhidden) { onUnhidden(post.id); }
        toast.success("Post unhidden.");
    };

    if (isHidden) {
        return (
            <Card className="w-full bg-white py-0">
                <CardContent className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground">
                    <span>Post hidden.</span>
                    <button onClick={handleUnhide} className="text-primary hover:underline text-xs">Undo</button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full bg-white py-0 relative">
            <CardContent className="flex gap-0 p-0 overflow-hidden">

                {/* Vote column */}
                <div
                    className="flex flex-col items-center justify-center gap-1 shrink-0 w-10 sm:w-14 self-stretch"
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
                <div className="flex flex-1 flex-col gap-1 min-w-0 p-3 sm:p-4 pr-10">

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
                        recipeDeleted ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-muted text-xs text-muted-foreground font-medium italic w-fit">
                                <IconChefHat className="size-3.5 shrink-0" />
                                Recipe deleted
                            </span>
                        ) : (
                            <Link
                                href={`/recipes/${post.recipeId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-primary/30 bg-primary/5 text-xs text-primary font-medium hover:bg-primary/10 transition-colors w-fit"
                            >
                                <IconChefHat className="size-3.5 shrink-0" />
                                View Recipe
                            </Link>
                        )
                    )}

                    {/* Meta */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
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
                    <div className="flex items-center pr-3 sm:pr-4">
                        <div className="relative size-16 sm:size-20 shrink-0 overflow-hidden rounded-lg">
                            <Image src={image} alt={post.title} fill sizes="80px" className="object-cover" />
                        </div>
                    </div>
                )}

            </CardContent>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
                        <IconDots className="size-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {user && user.uid === post.userId && (
                        <>
                            <DropdownMenuItem
                                className="gap-2"
                                onClick={() => router.push(`/forum/${post.id}?edit=true`)}
                            >
                                <IconPencil className="size-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="gap-2 text-destructive focus:text-destructive"
                                onClick={() => setShowDeleteDialog(true)}
                            >
                                <IconTrash className="size-4" /> Delete
                            </DropdownMenuItem>
                        </>
                    )}
                    {user && (
                        <DropdownMenuItem className="gap-2" onClick={handleSave}>
                            {isSaved ? <IconBookmarkFilled className="size-4" /> : <IconBookmark className="size-4" />}
                            {isSaved ? "Unsave" : "Save"}
                        </DropdownMenuItem>
                    )}
                    {user && user.uid !== post.userId && (
                        <>
                            <DropdownMenuItem
                                className={`gap-2 ${hasReported ? "text-muted-foreground" : "text-destructive focus:text-destructive"}`}
                                onClick={() => { if (!hasReported) { setShowReportDialog(true); } }}
                                disabled={hasReported}
                            >
                                <IconFlag className="size-4" />
                                {hasReported ? "Already reported" : "Report"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={handleHide}>
                                <IconEyeOff className="size-4" /> Hide
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmDialog
                open={showDeleteDialog}
                title="Delete post?"
                description="This action cannot be undone. Your post will be removed from the forum."
                confirmLabel="Delete"
                destructive
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteDialog(false)}
            />
            <ReportDialog
                open={showReportDialog}
                onSubmit={handleReport}
                onCancel={() => setShowReportDialog(false)}
            />
        </Card>
    );
}
