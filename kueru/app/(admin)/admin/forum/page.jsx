"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/api/adminFetch";
import DataTable from "../../_components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IconRefresh, IconTrash } from "@tabler/icons-react";

const STATUS_VARIANT = {
    available: "default",
    pending: "secondary",
    deleted: "destructive",
    archived: "outline",
};

const FILTERS = [
    { value: "all",       label: "All" },
    { value: "available", label: "Available" },
    { value: "pending",   label: "Pending" },
    { value: "deleted",   label: "Deleted" },
    { value: "archived",  label: "Archived" },
];

function formatDate(ts) {
    if (!ts) return "—";
    const seconds = ts._seconds ?? ts.seconds;
    return seconds ? new Date(seconds * 1000).toLocaleDateString() : "—";
}

const columns = [
    { key: "title", label: "Title" },
    { key: "authorUsername", label: "Author" },
    {
        key: "postType",
        label: "Type",
        render: (row) =>
            row.postType ? <Badge variant="outline">{row.postType}</Badge> : "—",
    },
    {
        key: "status",
        label: "Status",
        render: (row) => (
            <Badge variant={STATUS_VARIANT[row.status] ?? "outline"}>
                {row.status ?? "—"}
            </Badge>
        ),
    },
    { key: "upvotesCount", label: "Upvotes" },
    { key: "commentsCount", label: "Comments" },
    {
        key: "postedDateTime",
        label: "Posted",
        render: (row) => formatDate(row.postedDateTime),
    },
];

export default function ForumPage() {
    const router = useRouter();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("all");
    const [togglingId, setTogglingId] = useState(null);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminFetch("/api/admin/forum");
            const data = await res.json();
            setPosts(data.posts ?? []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const counts = useMemo(() => {
        const c = { all: posts.length, available: 0, pending: 0, deleted: 0, archived: 0 };
        posts.forEach((p) => { if (p.status in c) c[p.status]++; });
        return c;
    }, [posts]);

    const filtered = useMemo(
        () =>
            activeFilter === "all"
                ? posts
                : posts.filter((p) => p.status === activeFilter),
        [posts, activeFilter]
    );

    const handleToggleStatus = async (row) => {
        const newStatus = row.status === "deleted" ? "available" : "deleted";
        setTogglingId(row.id);
        try {
            await adminFetch(`/api/admin/forum/${row.id}`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
            });
            setPosts((prev) =>
                prev.map((p) => (p.id === row.id ? { ...p, status: newStatus } : p))
            );
        } finally {
            setTogglingId(null);
        }
    };

    const renderActions = (row) => {
        const isDeleted = row.status === "deleted";
        const isToggling = togglingId === row.id;
        return (
            <div className="flex items-center justify-end gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/admin/forum/${row.id}`)}
                >
                    View
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={isToggling}
                    className={
                        isDeleted
                            ? "text-green-600 hover:bg-green-50 hover:text-green-700"
                            : "text-destructive hover:bg-destructive/10 hover:text-destructive"
                    }
                    onClick={() => handleToggleStatus(row)}
                    title={isDeleted ? "Restore to available" : "Set as deleted"}
                >
                    {isDeleted ? (
                        <IconRefresh className="size-4" />
                    ) : (
                        <IconTrash className="size-4" />
                    )}
                </Button>
            </div>
        );
    };

    return (
        <div className="p-6">
            <h1 className="mb-1 text-2xl font-bold">Forum Posts</h1>
            <p className="mb-6 text-sm text-muted-foreground">
                {posts.length} post{posts.length !== 1 ? "s" : ""} total
            </p>

            {/* Status filter */}
            <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setActiveFilter(f.value)}
                        className={cn(
                            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                            activeFilter === f.value
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {f.label}
                        <span className="ml-1.5 text-xs opacity-60">
                            {counts[f.value]}
                        </span>
                    </button>
                ))}
            </div>

            <DataTable
                columns={columns}
                data={filtered}
                loading={loading}
                renderActions={renderActions}
                emptyMessage="No forum posts found."
            />
        </div>
    );
}
