"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { getPost } from "@/lib/db/forumService";
import { getComment, getRepliesByComment, createComment } from "@/lib/db/commentService";
import { Button } from "@/components/ui/button";
import { IconMessageCircle, IconSend, IconArrowUpRight } from "@tabler/icons-react";
import CommentCard from "../../_components/CommentCard";
import PostDetailCard from "../../_components/PostDetailCard";
import BackToForumButton from "../../../_components/BackToForumButton";

export default function SingleCommentPage({ params }) {
    const { id: postId, commentId } = use(params);
    const { user } = useAuth();

    const [post, setPost] = useState(null);
    const [rootComment, setRootComment] = useState(null);
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [commentText, setCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);

    const loadReplies = async () => {
        const fetched = await getRepliesByComment(commentId);
        setReplies(fetched);
    };

    //retrieve post and comment
    useEffect(() => {
        const init = async () => {
            try {
                const [fetchedPost, fetchedComment] = await Promise.all([
                    getPost(postId),
                    getComment(commentId),
                ]);
                if (!fetchedPost) { setError("Post not found."); return; }
                if (!fetchedComment) { setError("Comment not found."); return; }
                setPost(fetchedPost);
                setRootComment(fetchedComment);
                await loadReplies();
            } catch {
                setError("Failed to load. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [postId, commentId]);

    const handleReplySubmit = async () => {
        if (!commentText.trim() || !user) { return; }
        setSubmittingComment(true);
        try {
            await createComment(postId, user.uid, commentText.trim(), commentId);
            setCommentText("");
            await loadReplies();
        } finally {
            setSubmittingComment(false);
        }
    };

    if (loading) { return null; }
    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-sm text-destructive">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">

            <Navbar />

            <div className="mx-auto max-w-3xl px-4 py-6 flex flex-col gap-5 mb-10">

                <BackToForumButton />

                {/* Post card */}
                <PostDetailCard post={post} />

                {/* Context banner */}
                <Link
                    href={`/forum/${postId}#comments`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
                >
                    <IconArrowUpRight className="size-4" />
                    View full thread
                </Link>

                {/* Root comment */}
                <div className="rounded-xl border-l-4 border-l-primary border border-border bg-white shadow-sm overflow-hidden">
                    <div className="px-6 py-3 border-b border-border flex items-center gap-2">
                        <IconMessageCircle className="size-4 text-primary" />
                        <h2 className="text-sm font-semibold text-muted-foreground">Single comment thread</h2>
                    </div>
                    <div className="px-6">
                        <CommentCard
                            comment={rootComment}
                            currentUserId={user?.uid ?? null}
                            postId={postId}
                            depth={0}
                        />
                    </div>
                </div>

                {/* Replies card */}
                <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">

                    <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                        <IconMessageCircle className="size-4 text-primary" />
                        <h2 className="text-sm font-semibold">Replies ({replies.length})</h2>
                    </div>

                    {/* Reply input */}
                    {user ? (
                        <div className="px-6 py-4 border-b border-border flex gap-3 items-start">
                            <div className="flex items-center justify-center size-9 rounded-full bg-primary/10 shrink-0 text-sm font-bold text-primary">
                                {user.email?.[0].toUpperCase()}
                            </div>
                            <div className="flex-1 flex gap-2 items-end">
                                <textarea
                                    placeholder="Write a reply..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    rows={2}
                                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-colors"
                                />
                                <Button
                                    size="sm"
                                    onClick={handleReplySubmit}
                                    disabled={!commentText.trim() || submittingComment}
                                    className="gap-1.5 shrink-0"
                                >
                                    <IconSend className="size-3.5" />
                                    {submittingComment ? "Posting..." : "Reply"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="px-6 py-4 border-b border-border text-sm text-muted-foreground">
                            <Link href="/login" className="text-primary hover:underline">Sign in</Link> to reply.
                        </div>
                    )}

                    {/* Replies list */}
                    <div className="px-6 divide-y divide-border">
                        {replies.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-6 text-center">No replies yet. Be the first!</p>
                        ) : (
                            replies.map((reply) => (
                                <CommentCard
                                    key={reply.id}
                                    comment={reply}
                                    currentUserId={user?.uid ?? null}
                                    postId={postId}
                                    depth={0}
                                />
                            ))
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
}
