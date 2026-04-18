"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { adminFetch } from "@/lib/api/adminFetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    IconArrowLeft, IconCheck, IconRefresh, IconExternalLink,
} from "@tabler/icons-react";
import { getPreviewImageUrl } from "@/lib/media";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_VARIANT   = { pending: "secondary", resolved: "default" };
const ROLE_VARIANT     = { admin: "default", chef: "secondary", customer: "outline" };
const USER_STATUS_VARIANT = { active: "default", disabled: "destructive" };

// ── Shared helpers ────────────────────────────────────────────────────────────

function formatDate(ts) {
    if (!ts) return "—";
    const seconds = ts._seconds ?? ts.seconds;
    return seconds
        ? new Date(seconds * 1000).toLocaleDateString("en-US", {
              day: "numeric", month: "short", year: "numeric",
          })
        : "—";
}

function getInitials(name = "") {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase() || "?";
}

function SectionHeading({ children }) {
    return (
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {children}
        </p>
    );
}

function InfoRow({ label, value }) {
    if (value == null || value === "") return null;
    return (
        <div className="flex gap-2 text-sm">
            <span className="w-36 shrink-0 font-medium text-muted-foreground">{label}</span>
            <span className="break-all">{value}</span>
        </div>
    );
}

// ── Target preview components ─────────────────────────────────────────────────

function RecipePreview({ target }) {
    const firstImage = getPreviewImageUrl(target.images, null);
    return (
        <Card>
            <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                    <SectionHeading>Reported Recipe</SectionHeading>
                    <Button asChild variant="outline" size="sm" className="gap-1.5 shrink-0">
                        <Link href={`/recipes/${target.id}`} target="_blank" rel="noopener noreferrer">
                            View Recipe <IconExternalLink className="size-3.5" />
                        </Link>
                    </Button>
                </div>

                {firstImage && (
                    <div className="relative h-40 w-full overflow-hidden rounded-md bg-muted">
                        <Image src={firstImage} alt={target.name ?? "Recipe image"} fill className="object-cover" />
                    </div>
                )}

                <InfoRow label="Name"   value={target.name} />
                <InfoRow label="Author" value={target.authorUsername} />
                <div className="flex gap-2 text-sm">
                    <span className="w-36 shrink-0 font-medium text-muted-foreground">Status</span>
                    <Badge variant="outline" className="capitalize">{target.status ?? "—"}</Badge>
                </div>
                <InfoRow label="Upvotes" value={target.upvotes?.toLocaleString()} />
                <InfoRow label="Saves"   value={target.saved?.toLocaleString()} />
                <InfoRow label="Created" value={formatDate(target.createdAt)} />
                {target.tags?.length > 0 && (
                    <div className="flex gap-2 text-sm">
                        <span className="w-36 shrink-0 font-medium text-muted-foreground">Tags</span>
                        <div className="flex flex-wrap gap-1.5">
                            {target.tags.map((t) => (
                                <Badge key={t} variant="secondary">{t}</Badge>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function PostPreview({ target }) {
    const truncated = target.content?.length > 300
        ? target.content.slice(0, 300) + "…"
        : target.content;
    return (
        <Card>
            <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                    <SectionHeading>Reported Post</SectionHeading>
                    <Button asChild variant="outline" size="sm" className="gap-1.5 shrink-0">
                        <Link href={`/forum/${target.id}`} target="_blank" rel="noopener noreferrer">
                            View Post <IconExternalLink className="size-3.5" />
                        </Link>
                    </Button>
                </div>

                <InfoRow label="Title"    value={target.title} />
                <InfoRow label="Author"   value={target.authorUsername} />
                <InfoRow label="Category" value={target.postCategory} />
                <div className="flex gap-2 text-sm">
                    <span className="w-36 shrink-0 font-medium text-muted-foreground">Status</span>
                    <Badge variant="outline" className="capitalize">{target.status ?? "—"}</Badge>
                </div>
                <InfoRow label="Upvotes"  value={target.upvotesCount?.toLocaleString()} />
                <InfoRow label="Comments" value={target.commentsCount?.toLocaleString()} />
                <InfoRow label="Posted"   value={formatDate(target.postedDateTime)} />
                {truncated && (
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Content</p>
                        <p className="text-sm rounded-md bg-muted px-3 py-2 leading-relaxed">
                            {truncated}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function CommentPreview({ target }) {
    return (
        <Card>
            <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                    <SectionHeading>Reported Comment</SectionHeading>
                    {target.postId && (
                        <Button asChild variant="outline" size="sm" className="gap-1.5 shrink-0">
                            <Link href={`/forum/${target.postId}`} target="_blank" rel="noopener noreferrer">
                                View Parent Post <IconExternalLink className="size-3.5" />
                            </Link>
                        </Button>
                    )}
                </div>

                <InfoRow label="Author"      value={target.authorUsername ?? target.userId} />
                <InfoRow label="Upvotes"     value={target.upvotesCount?.toLocaleString()} />
                <InfoRow label="Posted"      value={formatDate(target.postedDateTime)} />
                <InfoRow label="Parent Post" value={target.postId} />
                {target.content && (
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Content</p>
                        <p className="text-sm rounded-md bg-muted px-3 py-2 leading-relaxed">
                            {target.content}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function UserPreview({ target }) {
    const status = target.status ?? "active";
    return (
        <Card>
            <CardContent className="p-5 space-y-3">
                <SectionHeading>Reported User</SectionHeading>

                <div className="flex items-center gap-3">
                    <Avatar className="size-12 shrink-0">
                        {target.profileImage && (
                            <AvatarImage src={target.profileImage} alt={target.username} />
                        )}
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                            {getInitials(target.username ?? target.displayName ?? "")}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{target.displayName ?? target.username}</p>
                        <p className="text-sm text-muted-foreground">@{target.username}</p>
                    </div>
                </div>

                <InfoRow label="Email"     value={target.email} />
                <div className="flex gap-2 text-sm">
                    <span className="w-36 shrink-0 font-medium text-muted-foreground">Role</span>
                    <Badge variant={ROLE_VARIANT[target.role] ?? "outline"} className="capitalize">
                        {target.role ?? "—"}
                    </Badge>
                </div>
                <div className="flex gap-2 text-sm">
                    <span className="w-36 shrink-0 font-medium text-muted-foreground">Status</span>
                    <Badge variant={USER_STATUS_VARIANT[status] ?? "outline"} className="capitalize">
                        {status}
                    </Badge>
                </div>
                <div className="flex gap-2 text-sm">
                    <span className="w-36 shrink-0 font-medium text-muted-foreground">Verified Chef</span>
                    <Badge variant={target.verified ? "default" : "outline"}>
                        {target.verified ? "Yes" : "No"}
                    </Badge>
                </div>
                <InfoRow label="Joined" value={formatDate(target.createdAt)} />
            </CardContent>
        </Card>
    );
}

function TargetPreview({ targetType, target }) {
    if (!target) {
        return (
            <Card>
                <CardContent className="p-5">
                    <SectionHeading>Reported {targetType}</SectionHeading>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Target no longer available — it may have been deleted.
                    </p>
                </CardContent>
            </Card>
        );
    }

    switch (targetType) {
        case "recipe":  return <RecipePreview  target={target} />;
        case "post":    return <PostPreview    target={target} />;
        case "comment": return <CommentPreview target={target} />;
        case "user":    return <UserPreview    target={target} />;
        default:        return null;
    }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportDetailPage() {
    const { reportId } = useParams();
    const router = useRouter();

    const [report, setReport]   = useState(null);
    const [target, setTarget]   = useState(undefined); // undefined = loading, null = not found
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminFetch(`/api/admin/reports/${reportId}`);
            if (res.status === 404) { setNotFound(true); return; }
            const data = await res.json();
            setReport(data.report ?? null);
            setTarget(data.target ?? null);
        } finally {
            setLoading(false);
        }
    }, [reportId]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    const handleStatusChange = async (newStatus) => {
        setActionLoading(true);
        try {
            await adminFetch(`/api/admin/reports/${reportId}`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
            });
            setReport((prev) => prev ? { ...prev, status: newStatus } : prev);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (notFound || !report) {
        return (
            <div className="p-6">
                <p className="text-sm text-muted-foreground">Report not found.</p>
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-1.5"
                    onClick={() => router.push("/admin/reports")}
                >
                    <IconArrowLeft className="size-4" /> Back to list
                </Button>
            </div>
        );
    }

    const isPending = report.status === "pending";

    return (
        <div className="p-6 max-w-3xl">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.push("/admin/reports")}
                        className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <IconArrowLeft className="size-4" /> Back to list
                    </button>
                    <h1 className="text-2xl font-bold">Report Detail</h1>
                </div>
                <Badge
                    variant={STATUS_VARIANT[report.status] ?? "outline"}
                    className="text-sm px-3 py-1 capitalize"
                >
                    {report.status}
                </Badge>
            </div>

            <div className="space-y-4">
                {/* Report metadata */}
                <Card>
                    <CardContent className="p-5 space-y-3">
                        <SectionHeading>Report Details</SectionHeading>
                        <div className="flex gap-2 text-sm">
                            <span className="w-36 shrink-0 font-medium text-muted-foreground">Target Type</span>
                            <Badge variant="outline" className="capitalize">{report.targetType ?? "—"}</Badge>
                        </div>
                        <InfoRow label="Target ID"   value={report.targetId} />
                        <InfoRow label="Reason"      value={report.reason} />
                        {report.details && (
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground w-36">Details</p>
                                <p className="text-sm rounded-md bg-muted px-3 py-2 leading-relaxed">
                                    {report.details}
                                </p>
                            </div>
                        )}
                        <InfoRow label="Reported By" value={report.reporterUsername} />
                        <InfoRow label="Submitted"   value={formatDate(report.createdAt)} />
                    </CardContent>
                </Card>

                <Separator />

                {/* Target preview */}
                <TargetPreview targetType={report.targetType} target={target} />

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    {isPending ? (
                        <Button
                            className="gap-1.5"
                            onClick={() => handleStatusChange("resolved")}
                            disabled={actionLoading}
                        >
                            <IconCheck className="size-4" />
                            {actionLoading ? "Resolving…" : "Mark as Resolved"}
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => handleStatusChange("pending")}
                            disabled={actionLoading}
                        >
                            <IconRefresh className="size-4" />
                            {actionLoading ? "Reopening…" : "Reopen Report"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
