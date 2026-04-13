"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { getPost } from "@/lib/db/forumService";
import { getUser } from "@/lib/db/userService";
import { getCommentsByPost, createComment } from "@/lib/db/commentService";
import { getUserVoteOnTarget, castVote, removeVote } from "@/lib/db/voteService";
import { Button } from "@/components/ui/button";
import { IconArrowUp, IconArrowDown, IconMessageCircle, IconSend } from "@tabler/icons-react";
import CommentCard from "./_components/CommentCard";
import BackToForumButton from "../_components/BackToForumButton";

function timeAgo(timestamp) {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function PostDetailPage({ params }) {
    const { id } = use(params);
    const { user } = useAuth();

    // ── Post state ────────────────────────────────────────────────────────────
    const [post, setPost] = useState(null);
    const [postAuthor, setPostAuthor] = useState(null);
    const [loadingPost, setLoadingPost] = useState(true);
    const [error, setError] = useState("");

    // ── Vote state ────────────────────────────────────────────────────────────
    const [voteCount, setVoteCount] = useState(0);
    const [userVote, setUserVote] = useState(null); // 1 | -1 | null

    // ── Comment state ─────────────────────────────────────────────────────────
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(true);
    const [commentText, setCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);

    // ── Fetch post ────────────────────────────────────────────────────────────
    useEffect(() => {
        getPost(id)
            .then((data) => {
                if (!data) { setError("Post not found."); return; }
                setPost(data);
                setVoteCount(data.upvotesCount ?? 0);
                if (data.userId) {
                    getUser(data.userId).then(setPostAuthor);
                }
            })
            .catch(() => setError("Failed to load post. Please try again later."))
            .finally(() => setLoadingPost(false));
    }, [id]);

    // ── Fetch user's existing vote on this post ───────────────────────────────
    useEffect(() => {
        if (user) {
            getUserVoteOnTarget(user.uid, id).then(setUserVote);
        }
    }, [user, id]);

    // ── Fetch comments ────────────────────────────────────────────────────────
    useEffect(() => {
        getCommentsByPost(id)
            .then(setComments)
            .finally(() => setLoadingComments(false));
    }, [id]);

    // ── Post vote handler ─────────────────────────────────────────────────────
    const handleVote = async (value) => {
        if (!user) return;
        if (userVote === value) {
            await removeVote(user.uid, id, "post");
            setVoteCount((prev) => prev - value);
            setUserVote(null);
        } else {
            const diff = userVote ? value - userVote : value;
            await castVote(user.uid, id, "post", value);
            setVoteCount((prev) => prev + diff);
            setUserVote(value);
        }
    };

    // ── Comment submit handler ────────────────────────────────────────────────
    const handleCommentSubmit = async () => {
        if (!commentText.trim() || !user) return;
        setSubmittingComment(true);
        try {
            await createComment(id, user.uid, commentText.trim());
            setCommentText("");
            // Refresh comments
            const updated = await getCommentsByPost(id);
            setComments(updated);
        } finally {
            setSubmittingComment(false);
        }
    };

    // ── Loading / error states ────────────────────────────────────────────────
    if (loadingPost) {
        return null;
    }
    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-sm text-destructive">{error}</p>
            </div>
        );
    }

    const tags = post.postType === "Discussion"
        ? (post.postCategory ? [post.postCategory] : [])
        : (post.tags ?? []);

    return (

        // ── Page wrapper ──────────────────────────────────────────────────────
        <div className="min-h-screen bg-background">

            <div className="h-14 w-full border-b bg-white flex items-center px-6">
                <Navbar />
            </div>

            {/* Main content */}
            <div className="mx-auto max-w-3xl px-4 py-6 flex flex-col gap-5">

                {/* Back button */}
                <BackToForumButton />

                {/* ── Post card ─────────────────────────────────────────────── */}
                <div className="rounded-xl border-l-4 border-l-primary border border-border bg-white shadow-sm overflow-hidden">

                    {/* Post image */}
                    {post.imageURLs?.[0] && (
                        <div className="relative w-full h-64 border-b border-border">
                            <Image
                                src={post.imageURLs[0]}
                                alt={post.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 768px"
                                className="object-cover"
                            />
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
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Posted by <Link href={`/profile/${postAuthor?.username ?? post.userId}`} className="text-primary font-medium hover:underline">@{postAuthor?.username ?? post.userId}</Link></span>
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

                            {/* Additional images */}
                            {post.imageURLs?.length > 1 && (
                                <div className="grid grid-cols-3 gap-2 mt-1">
                                    {post.imageURLs.slice(1).map((url, i) => (
                                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                                            <Image
                                                src={url}
                                                alt={`Image ${i + 2}`}
                                                fill
                                                sizes="200px"
                                                className="object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>
                        {/* End post content */}

                    </div>
                    {/* End post body */}

                </div>
                {/* ── End post card ──────────────────────────────────────────── */}

                {/* ── Comments card ─────────────────────────────────────────── */}
                <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">

                    {/* Comments header */}
                    <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                        <IconMessageCircle className="size-4 text-primary" />
                        <h2 className="text-sm font-semibold">Comments ({post.commentsCount})</h2>
                    </div>

                    {/* Comment input */}
                    {user ? (
                        <div className="px-6 py-4 border-b border-border flex gap-3 items-start">

                            {/* Avatar */}
                            <div className="flex items-center justify-center size-9 rounded-full bg-primary/10 shrink-0 text-sm font-bold text-primary">
                                {user.email?.[0].toUpperCase()}
                            </div>

                            {/* Input + submit */}
                            <div className="flex-1 flex gap-2 items-end">
                                <textarea
                                    placeholder="Share your thoughts..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    rows={2}
                                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-colors"
                                />
                                <Button
                                    size="sm"
                                    onClick={handleCommentSubmit}
                                    disabled={!commentText.trim() || submittingComment}
                                    className="gap-1.5 shrink-0"
                                >
                                    <IconSend className="size-3.5" />
                                    {submittingComment ? "Posting..." : "Comment"}
                                </Button>
                            </div>

                        </div>
                    ) : (
                        <div className="px-6 py-4 border-b border-border text-sm text-muted-foreground">
                            <Link href="/login" className="text-primary hover:underline">Sign in</Link> to leave a comment.
                        </div>
                    )}

                    {/* Comment list */}
                    <div className="px-6 divide-y divide-border">
                        {loadingComments ? (
                            <p className="text-sm text-muted-foreground py-6">Loading comments...</p>
                        ) : comments.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-6 text-center">No comments yet. Be the first!</p>
                        ) : (
                            comments.map((comment) => (
                                <CommentCard
                                    key={comment.id}
                                    comment={comment}
                                    currentUserId={user?.uid ?? null}
                                    postId={id}
                                />
                            ))
                        )}
                    </div>
                    {/* End comment list */}

                </div>
                {/* ── End comments card ──────────────────────────────────────── */}

            </div>
            {/* End main content */}

        </div>
        // ── End page wrapper ──────────────────────────────────────────────────

    );
}
