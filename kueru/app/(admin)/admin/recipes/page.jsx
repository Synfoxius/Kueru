"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/api/adminFetch";
import DataTable from "../../_components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IconArchive, IconRefresh, IconTrash } from "@tabler/icons-react";

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
    { key: "name", label: "Name" },
    { key: "authorUsername", label: "Author" },
    {
        key: "status",
        label: "Status",
        render: (row) => (
            <Badge variant={STATUS_VARIANT[row.status] ?? "outline"}>
                {row.status ?? "—"}
            </Badge>
        ),
    },
    { key: "upvotes", label: "Upvotes" },
    { key: "saved", label: "Saves" },
    {
        key: "createdAt",
        label: "Created",
        render: (row) => formatDate(row.createdAt),
    },
];

export default function RecipesPage() {
    const router = useRouter();
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("all");
    const [togglingId, setTogglingId] = useState(null);

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

    const counts = useMemo(() => {
        const c = { all: recipes.length, available: 0, pending: 0, deleted: 0, archived: 0 };
        recipes.forEach((r) => { if (r.status in c) c[r.status]++; });
        return c;
    }, [recipes]);

    const filtered = useMemo(
        () =>
            activeFilter === "all"
                ? recipes
                : recipes.filter((r) => r.status === activeFilter),
        [recipes, activeFilter]
    );

    const handleToggleStatus = async (row) => {
        const newStatus = row.status === "deleted" ? "available" : "deleted";
        setTogglingId(row.id);
        try {
            await adminFetch(`/api/admin/recipes/${row.id}`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
            });
            setRecipes((prev) =>
                prev.map((r) => (r.id === row.id ? { ...r, status: newStatus } : r))
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
                    onClick={() => router.push(`/admin/recipes/${row.id}`)}
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
            <h1 className="mb-1 text-2xl font-bold">Recipes</h1>
            <p className="mb-6 text-sm text-muted-foreground">
                {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} total
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
                emptyMessage="No recipes found."
            />
        </div>
    );
}
