"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPost } from "@/lib/db/forumService";
import { IconArrowUp } from "@tabler/icons-react";

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

    useEffect(() => {
        if (comment.postId) {
            getPost(comment.postId).then((p) => {
                if (p) { setPostTitle(p.title); }
            });
        }
    }, [comment.postId]);

    return (
        <div className="flex flex-col gap-2 py-4 px-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all">
            <Link
                href={`/forum/${comment.postId}`}
                className="text-xs text-muted-foreground hover:text-primary transition-colors line-clamp-1"
            >
                on: <span className="font-medium">{postTitle ?? "Loading..."}</span>
            </Link>

            {/* Comment content */}
            <Link href={`/forum/${comment.postId}#comments`} className="group block">
                <p className="text-sm text-foreground group-hover:text-primary transition-colors line-clamp-3 leading-relaxed">
                    {comment.content}
                </p>
            </Link>

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    <IconArrowUp className="size-3.5" />
                    {comment.upvotesCount ?? 0}
                </span>
                <span>{timeAgo(comment.postedDateTime)}</span>
            </div>

        </div>
    );
}
