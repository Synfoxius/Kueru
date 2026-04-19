"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { getPost } from "@/lib/db/forumService";
import { getUser } from "@/lib/db/userService";
import { getCommentsByPost, createComment } from "@/lib/db/commentService";
import { Button } from "@/components/ui/button";
import { IconMessageCircle, IconSend } from "@tabler/icons-react";
import CommentCard from "./_components/CommentCard";
import PostDetailCard from "./_components/PostDetailCard";
import BackToForumButton from "../_components/BackToForumButton";

export default function PostDetailPage({ params }) {
    const { id } = use(params);
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultEditing = searchParams.get("edit") === "true";

    // ── Post state ────────────────────────────────────────────────────────────
    const [post, setPost] = useState(null);
    const [loadingPost, setLoadingPost] = useState(true);
    const [error, setError] = useState("");

    // ── Comment state ─────────────────────────────────────────────────────────
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(true);
    const [commentText, setCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [currentUsername, setCurrentUsername] = useState(null);

    useEffect(() => {
        if (user) {
            getUser(user.uid).then((u) => {
                if (u) { setCurrentUsername(u.username); }
            });
        }
    }, [user]);

    // ── Fetch post ────────────────────────────────────────────────────────────
    useEffect(() => {
        getPost(id)
            .then((data) => {
                if (!data) { setError("not_found"); return; }
                if (data.deleted) { setError("deleted"); return; }
                setPost(data);
            })
            .catch(() => setError("failed"))
            .finally(() => setLoadingPost(false));
    }, [id]);

    // ── Fetch comments ────────────────────────────────────────────────────────
    useEffect(() => {
        getCommentsByPost(id)
            .then(setComments)
            .finally(() => setLoadingComments(false));
    }, [id]);

    // ── Comment submit handler ────────────────────────────────────────────────
    const handleCommentSubmit = async () => {
        if (!commentText.trim() || !user) { return; }
        setSubmittingComment(true);
        try {
            await createComment(id, user.uid, commentText.trim());
            setCommentText("");
            const updated = await getCommentsByPost(id);
            setComments(updated);
            setPost((prev) => prev ? { ...prev, commentsCount: (prev.commentsCount ?? 0) + 1 } : prev);
        } finally {
            setSubmittingComment(false);
        }
    };

    // ── Loading / error states ────────────────────────────────────────────────
    if (loadingPost) { return null; }
    if (error) {
        const isDeleted = error === "deleted";
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center px-4">
                    <p className={`text-sm ${isDeleted ? "text-muted-foreground" : "text-destructive"}`}>
                        {isDeleted ? "This post has been deleted." : error === "not_found" ? "Post not found." : "Failed to load post. Please try again later."}
                    </p>
                    <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">

            <Navbar />

            {/* Main content */}
            <div className="mx-auto max-w-3xl px-3 sm:px-4 py-4 sm:py-6 flex flex-col gap-5 mb-10">

                <BackToForumButton />

                <PostDetailCard post={post} onDeleted={() => router.push("/forum")} defaultEditing={defaultEditing} />

                {/* ── Comments card ─────────────────────────────────────────── */}
                <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">

                    {/* Comments header */}
                    <div className="px-4 sm:px-6 py-4 border-b border-border flex items-center gap-2">
                        <IconMessageCircle className="size-4 text-primary" />
                        <h2 className="text-sm font-semibold">
                            {post.commentsCount ?? 0} {post.commentsCount === 1 ? "Comment" : "Comments"}
                        </h2>
                    </div>

                    {/* Comment input */}
                    {user ? (
                        <div className="px-4 sm:px-6 py-4 border-b border-border flex gap-3 items-start">

                            {/* Avatar */}
                            <div className="flex items-center justify-center size-9 rounded-full bg-primary/10 shrink-0 text-sm font-bold text-primary">
                                {(currentUsername ?? user.email ?? "?")[0].toUpperCase()}
                            </div>

                            {/* Input + submit */}
                            <div className="flex-1 flex flex-col gap-2">
                                <textarea
                                    placeholder="Share your thoughts..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    rows={2}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-colors"
                                />
                                <Button
                                    size="sm"
                                    onClick={handleCommentSubmit}
                                    disabled={!commentText.trim() || submittingComment}
                                    className="gap-1.5 self-end"
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
                    <div className="px-3 sm:px-6 divide-y divide-border">
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
                                    onCommentCreated={() => setPost((prev) => prev ? { ...prev, commentsCount: (prev.commentsCount ?? 0) + 1 } : prev)}
                                    onCommentDeleted={(count) => setPost((prev) => prev ? { ...prev, commentsCount: Math.max(0, (prev.commentsCount ?? 0) - count) } : prev)}
                                />
                            ))
                        )}
                    </div>

                </div>
                {/* ── End comments card ──────────────────────────────────────── */}

            </div>

        </div>
    );
}
