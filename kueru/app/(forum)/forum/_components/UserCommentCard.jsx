"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPost } from "@/lib/db/forumService";
import { IconArrowUp, IconMessageCircle, IconCornerDownRight } from "@tabler/icons-react";

function timeAgo(timestamp) {
    if (!timestamp) { return ""; }
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) { return "just now"; }
    if (diff < 3600) { return `${Math.floor(diff / 60)}m ago`; }
    if (diff < 86400) { return `${Math.floor(diff / 3600)}h ago`; }
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function UserCommentCard({ comment }) {
    const [postTitle, setPostTitle] = useState(null);
    const [postDeleted, setPostDeleted] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (comment.postId) {
            getPost(comment.postId)
                .then((p) => {
                    if (p) { setPostTitle(p.title); }
                    else { setPostDeleted(true); }
                })
                .finally(() => setLoading(false));
        }
    }, [comment.postId]);

    const headerHref = postDeleted
        ? `/forum/${comment.postId}/comment/${comment.id}`
        : `/forum/${comment.postId}`;

    return (
        <article className="group relative rounded-xl border border-border bg-white shadow-sm hover:border-primary/40 hover:shadow-md transition-all overflow-hidden">

            {/* Parent post header */}
            <Link
                href={headerHref}
                className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/40 hover:bg-muted transition-colors"
            >
                <IconMessageCircle className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground shrink-0">Commented on</span>
                {loading ? (
                    <span className="h-3 flex-1 max-w-[180px] rounded bg-muted animate-pulse" />
                ) : (
                    <span className="text-xs font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                        {postTitle ?? "Deleted post"}
                    </span>
                )}
            </Link>

            {/* Comment body */}
            <Link
                href={`/forum/${comment.postId}/comment/${comment.id}`}
                className="block px-4 py-3"
            >
                <div className="flex gap-3">
                    {/* Accent rail */}
                    <div className="w-0.5 shrink-0 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />

                    <div className="flex-1 flex flex-col gap-2 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <IconCornerDownRight className="size-3.5 shrink-0" />
                            <span>Your reply</span>
                            <span>·</span>
                            <span>{timeAgo(comment.postedDateTime)}</span>
                        </div>

                        <p className="text-sm text-foreground leading-relaxed line-clamp-3 whitespace-pre-wrap">
                            {comment.content}
                        </p>

                        {/* Meta footer */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                            <span className="flex items-center gap-1">
                                <IconArrowUp className="size-3.5" />
                                <span className="tabular-nums">{comment.upvotesCount ?? 0}</span>
                            </span>
                            <span className="ml-auto text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                View thread →
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        </article>
    );
}
