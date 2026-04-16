"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminFetch } from "@/lib/api/adminFetch";
import ConfirmDialog from "../../../_components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconArrowLeft, IconChevronDown, IconExternalLink } from "@tabler/icons-react";

const STATUS_VARIANT = {
    available: "default",
    pending: "secondary",
    deleted: "destructive",
    archived: "outline",
};

const ALL_STATUSES = ["available", "pending", "deleted", "archived"];

function formatDate(ts) {
    if (!ts) return "—";
    const seconds = ts._seconds ?? ts.seconds;
    return seconds
        ? new Date(seconds * 1000).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
          })
        : "—";
}

function SectionHeading({ children }) {
    return (
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {children}
        </p>
    );
}

function InfoRow({ label, value }) {
    if (!value && value !== 0) return null;
    return (
        <div className="flex gap-2 text-sm">
            <span className="w-40 shrink-0 font-medium text-muted-foreground">{label}</span>
            <span className="break-all">{value}</span>
        </div>
    );
}

export default function ForumPostDetailPage() {
    const { postId } = useParams();
    const router = useRouter();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [pendingStatus, setPendingStatus] = useState(null);
    const [statusLoading, setStatusLoading] = useState(false);

    const fetchPost = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminFetch(`/api/admin/forum/${postId}`);
            if (res.status === 404) { setNotFound(true); return; }
            const data = await res.json();
            setPost(data.post ?? null);
        } finally {
            setLoading(false);
        }
    }, [postId]);

    useEffect(() => { fetchPost(); }, [fetchPost]);

    const handleStatusChange = async () => {
        if (!pendingStatus) return;
        setStatusLoading(true);
        try {
            await adminFetch(`/api/admin/forum/${postId}`, {
                method: "PATCH",
                body: JSON.stringify({ status: pendingStatus }),
            });
            setPost((prev) => ({ ...prev, status: pendingStatus }));
            setPendingStatus(null);
        } finally {
            setStatusLoading(false);
        }
    };

    if (loading) {
        return <div className="p-6"><p className="text-sm text-muted-foreground">Loading...</p></div>;
    }

    if (notFound || !post) {
        return (
            <div className="p-6">
                <p className="text-sm text-muted-foreground">Post not found.</p>
                <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => router.push("/admin/forum")}>
                    <IconArrowLeft className="size-4" /> Back to list
                </Button>
            </div>
        );
    }

    const p = post;

    return (
        <div className="p-6 max-w-3xl">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.push("/admin/forum")}
                        className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <IconArrowLeft className="size-4" /> Back to list
                    </button>
                    <h1 className="text-2xl font-bold">{p.title}</h1>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={STATUS_VARIANT[p.status] ?? "outline"} className="text-sm px-3 py-1">
                        {p.status ?? "—"}
                    </Badge>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5">
                                Set status <IconChevronDown className="size-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Post Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {ALL_STATUSES.map((s) => (
                                <DropdownMenuItem
                                    key={s}
                                    disabled={p.status === s}
                                    onClick={() => setPendingStatus(s)}
                                    className="capitalize"
                                >
                                    {s}
                                    {p.status === s && (
                                        <span className="ml-auto text-xs text-muted-foreground">current</span>
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="space-y-4">
                {/* Post meta */}
                <Card>
                    <CardContent className="p-5 space-y-1.5">
                        <SectionHeading>Post Info</SectionHeading>
                        <InfoRow label="Author"       value={p.authorUsername} />
                        <InfoRow label="Author ID"    value={p.userId} />
                        <InfoRow label="Post Type"    value={p.postType} />
                        <InfoRow label="Category"     value={p.postCategory} />
                        <InfoRow label="Content Type" value={p.contentType} />
                        <InfoRow label="Upvotes"      value={p.upvotesCount} />
                        <InfoRow label="Comments"     value={p.commentsCount} />
                        <InfoRow label="Posted"       value={formatDate(p.postedDateTime)} />
                        {p.editedDateTime && (
                            <InfoRow label="Last edited" value={formatDate(p.editedDateTime)} />
                        )}
                        {p.recipeId && (
                            <InfoRow label="Linked recipe" value={p.recipeId} />
                        )}
                    </CardContent>
                </Card>

                {/* Content */}
                {p.content && (
                    <Card>
                        <CardContent className="p-5 space-y-2">
                            <SectionHeading>Content</SectionHeading>
                            <p className="text-sm whitespace-pre-wrap">{p.content}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Images */}
                {p.imageURLs?.length > 0 && (
                    <Card>
                        <CardContent className="p-5 space-y-3">
                            <SectionHeading>Images ({p.imageURLs.length})</SectionHeading>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {p.imageURLs.map((url, i) => (
                                    <a
                                        key={i}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative block overflow-hidden rounded-md border border-border bg-muted aspect-square"
                                    >
                                        <img
                                            src={url}
                                            alt={`Image ${i + 1}`}
                                            className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                                        />
                                        <span className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-black/50 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                                            Image {i + 1}
                                            <IconExternalLink className="size-3" />
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Confirm dialog for status changes */}
            <ConfirmDialog
                open={!!pendingStatus}
                onOpenChange={(open) => { if (!open) setPendingStatus(null); }}
                title="Change Post Status"
                description={`Set this post's status to "${pendingStatus}"?`}
                confirmLabel="Confirm"
                onConfirm={handleStatusChange}
                loading={statusLoading}
                variant={pendingStatus === "deleted" ? "destructive" : "default"}
            />
        </div>
    );
}
