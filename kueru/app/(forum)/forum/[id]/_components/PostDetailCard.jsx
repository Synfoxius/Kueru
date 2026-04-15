"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUser } from "@/lib/db/userService";
import { getUserVoteOnTarget, castVote, removeVote } from "@/lib/db/voteService";
import { updatePost, deletePost } from "@/lib/db/forumService";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { IconArrowUp, IconArrowDown, IconMessageCircle, IconChefHat, IconPencil, IconCheck, IconX, IconDots, IconTrash } from "@tabler/icons-react";
import ImageGallery from "./ImageGallery";
import ConfirmDialog from "@/components/ConfirmDialog";

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
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        await deletePost(post.id);
        setShowDeleteDialog(false);
        if (onDeleted) { onDeleted(); }
    };

    const tags = post.postType === "Discussion"
        ? (post.postCategory ? [post.postCategory] : [])
        : (post.tags ?? []);

    return (
        <div className="relative rounded-xl border-l-4 border-l-primary border border-border bg-white shadow-sm overflow-hidden">

            {/* "..." dropdown — owner only */}
            {isOwner && (
                <div className="absolute top-3 right-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground transition-colors">
                                <IconDots className="size-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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

        </div>
    );
}
