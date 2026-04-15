"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/api/adminFetch";
import DataTable from "../../_components/DataTable";
import ConfirmDialog from "../../_components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconTrash } from "@tabler/icons-react";

function formatDate(ts) {
    if (!ts) return "—";
    const seconds = ts._seconds ?? ts.seconds;
    return seconds ? new Date(seconds * 1000).toLocaleDateString() : "—";
}

const columns = [
    { key: "title", label: "Title" },
    { key: "userId", label: "Author ID" },
    {
        key: "postType",
        label: "Type",
        render: (row) =>
            row.postType ? (
                <Badge variant="outline">{row.postType}</Badge>
            ) : (
                "—"
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
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

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

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await adminFetch(`/api/admin/forum/${deleteTarget.id}`, {
                method: "DELETE",
            });
            setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
            setDeleteTarget(null);
        } finally {
            setDeleteLoading(false);
        }
    };

    const renderActions = (row) => (
        <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteTarget(row)}
        >
            <IconTrash className="size-4" />
        </Button>
    );

    return (
        <div className="p-6">
            <h1 className="mb-1 text-2xl font-bold">Forum Posts</h1>
            <p className="mb-6 text-sm text-muted-foreground">
                {posts.length} post{posts.length !== 1 ? "s" : ""} total
            </p>
            <DataTable
                columns={columns}
                data={posts}
                loading={loading}
                renderActions={renderActions}
                emptyMessage="No forum posts found."
            />
            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete Post"
                description={`Are you sure you want to permanently delete "${deleteTarget?.title}"? This cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={handleDelete}
                loading={deleteLoading}
            />
        </div>
    );
}
