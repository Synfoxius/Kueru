"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/api/adminFetch";
import DataTable from "../../_components/DataTable";
import ConfirmDialog from "../../_components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { IconTrash } from "@tabler/icons-react";

function formatDate(ts) {
    if (!ts) return "—";
    const seconds = ts._seconds ?? ts.seconds;
    return seconds ? new Date(seconds * 1000).toLocaleDateString() : "—";
}

const columns = [
    { key: "name", label: "Name" },
    { key: "userId", label: "Author ID" },
    { key: "upvotes", label: "Upvotes" },
    { key: "saved", label: "Saves" },
    {
        key: "createdAt",
        label: "Created",
        render: (row) => formatDate(row.createdAt),
    },
];

export default function RecipesPage() {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchRecipes = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminFetch("/api/admin/recipes");
            const data = await res.json();
            setRecipes(data.recipes ?? []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await adminFetch(`/api/admin/recipes/${deleteTarget.id}`, {
                method: "DELETE",
            });
            setRecipes((prev) => prev.filter((r) => r.id !== deleteTarget.id));
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
            <h1 className="mb-1 text-2xl font-bold">Recipes</h1>
            <p className="mb-6 text-sm text-muted-foreground">
                {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} total
            </p>
            <DataTable
                columns={columns}
                data={recipes}
                loading={loading}
                renderActions={renderActions}
                emptyMessage="No recipes found."
            />
            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete Recipe"
                description={`Are you sure you want to permanently delete "${deleteTarget?.name}"? This cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={handleDelete}
                loading={deleteLoading}
            />
        </div>
    );
}
