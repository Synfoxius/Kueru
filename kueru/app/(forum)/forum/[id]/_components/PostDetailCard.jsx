"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUserVoteOnTarget, castVote, removeVote } from "@/lib/db/voteService";
import { updatePost, deletePost } from "@/lib/db/forumService";
import { getRecipe } from "@/lib/db/recipeService";
import { getUser, savePost, unsavePost } from "@/lib/db/userService";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { IconArrowUp, IconArrowDown, IconMessageCircle, IconPencil, IconCheck, IconX, IconDots, IconTrash, IconBookmark, IconBookmarkFilled, IconFlag, IconChefHat } from "@tabler/icons-react";
import ImageGallery from "./ImageGallery";
import ConfirmDialog from "@/components/ConfirmDialog";
import ReportDialog from "@/components/ReportDialog";
import { createReport, hasUserReported } from "@/lib/db/reportService";
import { toast } from "sonner";
import RecipePreviewCard from "@/app/(forum)/forum/_components/RecipePreviewCard";

function timeAgo(timestamp) {
    if (!timestamp) { return ""; }
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) { return "just now"; }
    if (diff < 3600) { return `${Math.floor(diff / 60)}m ago`; }
    if (diff < 86400) { return `${Math.floor(diff / 3600)}h ago`; }
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function PostDetailCard({ post, onDeleted, defaultEditing = false }) {
    const { user } = useAuth();
    const [postAuthor, setPostAuthor] = useState(null);
    const [voteCount, setVoteCount] = useState(post.upvotesCount ?? 0);
    const [userVote, setUserVote] = useState(null);

    const [isEditing, setIsEditing] = useState(defaultEditing);
    const [editContent, setEditContent] = useState(post.content ?? "");
    const [currentContent, setCurrentContent] = useState(post.content ?? "");
    const [editedAt, setEditedAt] = useState(post.editedDateTime ?? null);
    const [saving, setSaving] = useState(false);

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [linkedRecipe, setLinkedRecipe] = useState(null);
    const [recipeDeleted, setRecipeDeleted] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [hasReported, setHasReported] = useState(false);

    const isOwner = user?.uid === post.userId;

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

    useEffect(() => {
        if (post.postType === "Recipe" && post.recipeId) {
            getRecipe(post.recipeId).then((r) => {
                if (!r || r.status === "deleted") {
                    setRecipeDeleted(true);
                } else {
                    setLinkedRecipe(r);
                }
            });
        }
    }, [post.postType, post.recipeId]);

    useEffect(() => {
        if (user) {
            getUser(user.uid).then((u) => {
                setIsSaved(u?.savedPosts?.includes(post.id) ?? false);
            });
        }
    }, [user, post.id]);

    useEffect(() => {
        if (user) {
            hasUserReported(post.id, user.uid).then(setHasReported);
        }
    }, [user, post.id]);

    const handleSave = async () => {
        if (!user) { return; }
        if (isSaved) {
            await unsavePost(user.uid, post.id);
            setIsSaved(false);
            toast.success("Post unsaved.");
        } else {
            await savePost(user.uid, post.id);
            setIsSaved(true);
            toast.success("Post saved.");
        }
    };

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

    const handleEditStart = () => {
        setEditContent(currentContent);
        setIsEditing(true);
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditContent(currentContent);
    };

    const handleEditSave = async () => {
        if (editContent.trim() === currentContent) { setIsEditing(false); return; }
        setSaving(true);
        try {
            await updatePost(post.id, editContent.trim());
            setCurrentContent(editContent.trim());
            setEditedAt(new Date());
            setIsEditing(false);
            toast.success("Your post has been edited.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        await deletePost(post.id);
        setShowDeleteDialog(false);
        toast.success("Post deleted.");
        if (onDeleted) { onDeleted(); }
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

    const tags = post.postType === "Discussion"
        ? (post.postCategory ? [post.postCategory] : [])
        : (post.tags ?? []);

    return (
        <div className="relative rounded-xl border-l-4 border-l-primary border border-border bg-white shadow-sm overflow-hidden">

            {/* "..." dropdown */}
            {user && (
                <div className="absolute top-3 right-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground transition-colors">
                                <IconDots className="size-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={handleSave}>
                                {isSaved ? <IconBookmarkFilled className="size-4" /> : <IconBookmark className="size-4" />}
                                {isSaved ? "Unsave" : "Save"}
                            </DropdownMenuItem>
                            {isOwner && (
                                <>
                                    <DropdownMenuItem
                                        className="gap-2"
                                        onClick={handleEditStart}
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
                            {!isOwner && (
                                <DropdownMenuItem
                                    className={`gap-2 ${hasReported ? "text-muted-foreground" : "text-destructive focus:text-destructive"}`}
                                    onClick={() => { if (!hasReported) { setShowReportDialog(true); } }}
                                    disabled={hasReported}
                                >
                                    <IconFlag className="size-4" />
                                    {hasReported ? "Already reported" : "Report"}
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}

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
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
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
                        {editedAt && (
                            <>
                                <span>·</span>
                                <span className="italic">edited {timeAgo(editedAt)}</span>
                            </>
                        )}
                        <span>·</span>
                        <span className="flex items-center gap-1">
                            <IconMessageCircle className="size-3" />
                            {post.commentsCount} comments
                        </span>
                    </div>

                    {/* Body text / edit textarea */}
                    {isEditing ? (
                        <div className="flex flex-col gap-2">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={6}
                                autoFocus
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none leading-relaxed transition-colors"
                            />
                            <div className="flex items-center gap-2 justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleEditCancel}
                                    className="gap-1.5 text-muted-foreground"
                                >
                                    <IconX className="size-3.5" />
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => setShowSaveDialog(true)}
                                    disabled={saving || !editContent.trim()}
                                    className="gap-1.5"
                                >
                                    <IconCheck className="size-3.5" />
                                    {saving ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        currentContent && (
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{currentContent}</p>
                        )
                    )}

                    {/* Recipe preview */}
                    {post.postType === "Recipe" && post.recipeId && (
                        recipeDeleted ? (
                            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground italic">
                                <IconChefHat className="size-4 shrink-0" />
                                This recipe has been deleted.
                            </div>
                        ) : linkedRecipe && (
                            <RecipePreviewCard recipe={linkedRecipe} linkable={true} />
                        )
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

            <ConfirmDialog
                open={showSaveDialog}
                title="Save changes?"
                description="Are you sure you want to save these changes to your post?"
                confirmLabel="Save"
                onConfirm={() => { setShowSaveDialog(false); handleEditSave(); }}
                onCancel={() => setShowSaveDialog(false)}
            />

            <ConfirmDialog
                open={showDeleteDialog}
                title="Delete post?"
                description="This action cannot be undone. The post and all its comments will be permanently deleted."
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

        </div>
    );
}
