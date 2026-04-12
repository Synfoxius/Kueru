"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getUser } from "@/lib/db/userService";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { IconArrowUp, IconArrowDown, IconDots, IconMessageCircle, IconFlag, IconEyeOff } from "@tabler/icons-react";

function timeAgo(timestamp) {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function PostCard({ post }) {
    const [username, setUsername] = useState(null);

    useEffect(() => {
        if (post.userId) {
            getUser(post.userId).then((user) => {
                if (user) setUsername(user.username);
            });
        }
    }, [post.userId]);

    const upvotesCount = post.upvotesCount;
    const commentsCount = post.commentsCount;
    const postedDateTime = timeAgo(post.postedDateTime);
    const content = post.content;
    const image = post.imageURLs?.[0] ?? null;
    const postType = post.postType ?? "Discussion";
    const contentType = post.contentType ?? "text";

    return (
        <Card className="w-full bg-white py-0 relative">
            <CardContent className="flex gap-0 p-0 overflow-hidden">
                {/* Vote column */}
                <div
                    className="flex flex-col items-center justify-center gap-1 shrink-0 w-14 self-stretch"
                    style={{ backgroundColor: "#f9f5f3" }}
                >
                    <button className="text-muted-foreground hover:text-primary">
                        <IconArrowUp className="size-5" />
                    </button>
                    <span className="text-sm font-semibold">{upvotesCount}</span>
                    <button className="text-muted-foreground hover:text-destructive">
                        <IconArrowDown className="size-5" />
                    </button>
                </div>

                <Separator orientation="vertical" className="h-auto" />

                {/* Content */}
                <div className="flex flex-1 flex-col gap-1 min-w-0 p-4 pr-10">
                    <Link href={`/forum/${post.id}`} className="font-semibold text-foreground hover:underline line-clamp-2">
                        {post.title}
                    </Link>

                    {content && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{content}</p>
                    )}

                    {(() => {
                        const displayTags = post.postType === "Discussion"
                            ? (post.postCategory ? [post.postCategory] : [])
                            : (post.tags ?? []);
                        return displayTags.length > 0 && (
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
                        );
                    })()}

                    {/* Meta */}
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Posted by <button className="text-primary hover:underline">@{username ?? post.userId}</button></span>
                        <span>·</span>
                        <span>{postedDateTime}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                            <IconMessageCircle className="size-3" />
                            <button className="text-primary hover:underline">{commentsCount} comments</button>
                        </span>
                    </div>
                </div>

                {/* Image */}
                {image && (
                    <div className="flex items-center pr-4">
                        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg">
                            <Image src={image} alt={post.title} fill className="object-cover" />
                        </div>
                    </div>
                )}
            </CardContent>

            {/* "..." dropdown — absolute top right */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
                        <IconDots className="size-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2">
                        <IconFlag className="size-4" /> Report
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                        <IconEyeOff className="size-4" /> Hide
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </Card>
    );
}