"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUser } from "@/lib/db/userService";
import { getRepliesByComment, createComment } from "@/lib/db/commentService";
import { castVote, removeVote, getUserVoteOnTarget } from "@/lib/db/voteService";
import { Button } from "@/components/ui/button";
import { IconArrowUp, IconArrowDown, IconCornerDownRight, IconSend } from "@tabler/icons-react";

const MAX_DEPTH = 5;

function timeAgo(timestamp) {
    if (!timestamp) {
        return "";
    }

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) { return "just now"; }
    if (diff < 3600) { return `${Math.floor(diff / 60)}m ago`; }
    if (diff < 86400) { return `${Math.floor(diff / 3600)}h ago`; }
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function CommentCard({ comment, currentUserId, postId, depth = 0 }) {
    const [username, setUsername] = useState(null);
    const [voteCount, setVoteCount] = useState(comment.upvotesCount ?? 0);
    const [userVote, setUserVote] = useState(null);

    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [submittingReply, setSubmittingReply] = useState(false);
    const [replies, setReplies] = useState([]);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [repliesVisible, setRepliesVisible] = useState(false);

    useEffect(() => {
        getUser(comment.userId).then((u) => {
            if (u) { setUsername(u.username); }
        });
    }, [comment.userId]);

    useEffect(() => {
        if (currentUserId) {
            getUserVoteOnTarget(currentUserId, comment.id).then(setUserVote);
        }
    }, [currentUserId, comment.id]);

    const handleVote = async (value) => {
        if (!currentUserId) { return; }
        if (userVote === value) {
            await removeVote(currentUserId, comment.id, "comment");
            setVoteCount((prev) => prev - value);
            setUserVote(null);
        } else {
            const diff = userVote ? value - userVote : value;
            await castVote(currentUserId, comment.id, "comment", value);
            setVoteCount((prev) => prev + diff);
            setUserVote(value);
        }
    };

    const loadReplies = async () => {
        setLoadingReplies(true);
        try {
            const fetched = await getRepliesByComment(comment.id);
            setReplies(fetched);
            setRepliesVisible(true);
        } finally {
            setLoadingReplies(false);
        }
    };

    const toggleReplies = () => {
        if (repliesVisible) {
            setRepliesVisible(false);
        } else {
            loadReplies();
        }
    };

    const handleReplySubmit = async () => {
        if (!replyText.trim() || !currentUserId) { return; }
        setSubmittingReply(true);
        try {
            await createComment(postId, currentUserId, replyText.trim(), comment.id);
            setReplyText("");
            setShowReplyInput(false);
            await loadReplies();
        } finally {
            setSubmittingReply(false);
        }
    };

    const atMaxDepth = depth >= MAX_DEPTH;

    return (
        <div id={`comment-${comment.id}`} className="flex flex-col">

            {/* Comment row */}
            <div className="flex items-start gap-3 py-4">

                {/* Profile pic */}
                <div className="flex items-center justify-center size-9 rounded-full bg-primary/10 shrink-0 text-sm font-bold text-primary">
                    {username ? username[0].toUpperCase() : "?"}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0 flex flex-col gap-2">

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Link
                            href={`/profile/${username ?? comment.userId}`}
                            className="font-semibold text-foreground hover:text-primary hover:underline"
                        >
                            @{username ?? comment.userId}
                        </Link>
                        <span>·</span>
                        <span>{timeAgo(comment.postedDateTime)}</span>
                    </div>

                    {/* Content */}
                    <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>

                    {/* Actions row */}
                    <div className="flex items-center gap-3">

                        {currentUserId && (
                            <button
                                onClick={() => setShowReplyInput((prev) => !prev)}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                            >
                                <IconCornerDownRight className="size-3.5" />
                                Reply
                            </button>
                        )}

                        {(replies.length > 0 || !repliesVisible) && (
                            <button
                                onClick={toggleReplies}
                                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                            >
                                {loadingReplies
                                    ? "Loading..."
                                    : repliesVisible
                                    ? "Hide replies"
                                    : "Show replies"}
                            </button>
                        )}

                    </div>

                    {/* Reply input */}
                    {showReplyInput && (
                        <div className="flex gap-2 items-end mt-1">
                            <textarea
                                placeholder={`Replying to @${username ?? "user"}...`}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={2}
                                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-colors"
                            />
                            <Button
                                size="sm"
                                onClick={handleReplySubmit}
                                disabled={!replyText.trim() || submittingReply}
                                className="gap-1.5 shrink-0"
                            >
                                <IconSend className="size-3.5" />
                                {submittingReply ? "Posting..." : "Reply"}
                            </Button>
                        </div>
                    )}

                </div>
                {/* End body */}

                {/* Vote column */}
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <button
                        onClick={() => handleVote(1)}
                        className={`p-1 rounded transition-colors ${userVote === 1 ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                    >
                        <IconArrowUp className="size-4" />
                    </button>
                    <span className="text-xs font-semibold tabular-nums">{voteCount}</span>
                    <button
                        onClick={() => handleVote(-1)}
                        className={`p-1 rounded transition-colors ${userVote === -1 ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}
                    >
                        <IconArrowDown className="size-4" />
                    </button>
                </div>

            </div>
            {/* End comment row */}

            {/* Replies */}
            {repliesVisible && replies.length > 0 && (
                atMaxDepth ? (
                    <Link
                        href={`/forum/${postId}/comment/${comment.id}`}
                        className="ml-4 mb-2 flex items-center gap-1.5 text-xs text-primary hover:underline w-fit"
                    >
                        <IconCornerDownRight className="size-3.5" />
                        Continue this thread
                    </Link>
                ) : (
                    <div className="ml-4 pl-4 border-l-2 border-primary/20 flex flex-col">
                        {replies.map((reply) => (
                            <CommentCard
                                key={reply.id}
                                comment={reply}
                                currentUserId={currentUserId}
                                postId={postId}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )
            )}

        </div>
    );
}