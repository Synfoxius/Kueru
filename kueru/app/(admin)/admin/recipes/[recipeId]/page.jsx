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
import { Input } from "@/components/ui/input";
import { IconArrowLeft, IconChevronDown, IconExternalLink, IconPlus, IconX } from "@tabler/icons-react";
import { normalizeMediaItems } from "@/lib/media";
import { STATUS_COLOR } from "../../../_lib/badgeColors";

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

export default function RecipeDetailPage() {
    const { recipeId } = useParams();
    const router = useRouter();

    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [pendingStatus, setPendingStatus] = useState(null);
    const [statusLoading, setStatusLoading] = useState(false);

    // Tag editing
    const [editingTags, setEditingTags] = useState(false);
    const [editTags, setEditTags] = useState([]);
    const [tagInput, setTagInput] = useState("");
    const [tagsLoading, setTagsLoading] = useState(false);

    const fetchRecipe = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminFetch(`/api/admin/recipes/${recipeId}`);
            if (res.status === 404) { setNotFound(true); return; }
            const data = await res.json();
            setRecipe(data.recipe ?? null);
        } finally {
            setLoading(false);
        }
    }, [recipeId]);

    useEffect(() => { fetchRecipe(); }, [fetchRecipe]);

    const handleStatusChange = async () => {
        if (!pendingStatus) return;
        setStatusLoading(true);
        try {
            await adminFetch(`/api/admin/recipes/${recipeId}`, {
                method: "PATCH",
                body: JSON.stringify({ status: pendingStatus }),
            });
            setRecipe((prev) => ({ ...prev, status: pendingStatus }));
            setPendingStatus(null);
        } finally {
            setStatusLoading(false);
        }
    };

    const startEditingTags = () => {
        setEditTags(recipe.tags ? [...recipe.tags] : []);
        setTagInput("");
        setEditingTags(true);
    };

    const cancelEditingTags = () => {
        setEditingTags(false);
        setTagInput("");
    };

    const addTag = () => {
        const val = tagInput.trim().toLowerCase();
        if (val && !editTags.includes(val)) {
            setEditTags((prev) => [...prev, val]);
        }
        setTagInput("");
    };

    const handleTagInputKeyDown = (e) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag();
        }
    };

    const removeTag = (tag) => setEditTags((prev) => prev.filter((t) => t !== tag));

    const saveTags = async () => {
        setTagsLoading(true);
        try {
            await adminFetch(`/api/admin/recipes/${recipeId}`, {
                method: "PATCH",
                body: JSON.stringify({ tags: editTags }),
            });
            setRecipe((prev) => ({ ...prev, tags: editTags }));
            setEditingTags(false);
        } finally {
            setTagsLoading(false);
        }
    };

    if (loading) {
        return <div className="p-6"><p className="text-sm text-muted-foreground">Loading...</p></div>;
    }

    if (notFound || !recipe) {
        return (
            <div className="p-6">
                <p className="text-sm text-muted-foreground">Recipe not found.</p>
                <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => router.push("/admin/recipes")}>
                    <IconArrowLeft className="size-4" /> Back to list
                </Button>
            </div>
        );
    }

    const r = recipe;
    const ingredientEntries = r.ingredients ? Object.entries(r.ingredients) : [];

    return (
        <div className="p-6 max-w-3xl">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.push("/admin/recipes")}
                        className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <IconArrowLeft className="size-4" /> Back to list
                    </button>
                    <h1 className="text-2xl font-bold">{r.name}</h1>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={`text-sm px-3 py-1 capitalize ${STATUS_COLOR[r.status] ?? ""}`}>
                        {r.status ?? "—"}
                    </Badge>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5">
                                Set status <IconChevronDown className="size-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Recipe Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {ALL_STATUSES.map((s) => (
                                <DropdownMenuItem
                                    key={s}
                                    disabled={r.status === s}
                                    onClick={() => setPendingStatus(s)}
                                    className="capitalize"
                                >
                                    {s}
                                    {r.status === s && (
                                        <span className="ml-auto text-xs text-muted-foreground">current</span>
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="space-y-4">
                {/* Basic info */}
                <Card>
                    <CardContent className="p-5 space-y-1.5">
                        <SectionHeading>Recipe Info</SectionHeading>
                        <InfoRow label="Author"   value={r.authorUsername} />
                        <InfoRow label="Author ID" value={r.userId} />
                        <InfoRow label="Time"     value={r.time ? `${r.time} min` : null} />
                        <InfoRow label="Servings" value={r.servings} />
                        <InfoRow label="Upvotes"  value={r.upvotes} />
                        <InfoRow label="Saves"    value={r.saved} />
                        <InfoRow label="Created"  value={formatDate(r.createdAt)} />
                        {r.challengeId && (
                            <InfoRow label="Challenge" value={r.challengeId} />
                        )}
                    </CardContent>
                </Card>

                {/* Tags */}
                <Card>
                    <CardContent className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <SectionHeading>Tags</SectionHeading>
                            {!editingTags && (
                                <Button variant="outline" size="sm" onClick={startEditingTags}>
                                    Edit Tags
                                </Button>
                            )}
                        </div>

                        {editingTags ? (
                            <div className="space-y-3">
                                {/* Current tags with remove buttons */}
                                <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                                    {editTags.length === 0 && (
                                        <span className="text-sm text-muted-foreground">No tags — add one below</span>
                                    )}
                                    {editTags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                                        >
                                            {tag}
                                            <button
                                                onClick={() => removeTag(tag)}
                                                className="ml-0.5 rounded-full hover:bg-black/10 p-0.5 transition-colors"
                                                aria-label={`Remove ${tag}`}
                                            >
                                                <IconX className="size-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                {/* Add tag input */}
                                <div className="flex gap-2">
                                    <Input
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagInputKeyDown}
                                        placeholder="Type a tag and press Enter"
                                        className="h-8 text-sm"
                                    />
                                    <Button size="sm" variant="outline" onClick={addTag} className="gap-1 shrink-0">
                                        <IconPlus className="size-3.5" /> Add
                                    </Button>
                                </div>

                                {/* Save / Cancel */}
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={saveTags} disabled={tagsLoading}>
                                        {tagsLoading ? "Saving…" : "Save Tags"}
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={cancelEditingTags} disabled={tagsLoading}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {r.tags?.length > 0
                                    ? r.tags.map((tag) => (
                                        <Badge key={tag} variant="secondary">{tag}</Badge>
                                      ))
                                    : <span className="text-sm text-muted-foreground">No tags</span>
                                }
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Ingredients */}
                {ingredientEntries.length > 0 && (
                    <Card>
                        <CardContent className="p-5 space-y-2">
                            <SectionHeading>Ingredients</SectionHeading>
                            <div className="space-y-1">
                                {ingredientEntries.map(([name, amountArr]) => {
                                    const amount = Array.isArray(amountArr)
                                        ? `${amountArr[0]} ${amountArr[1] ?? ""}`.trim()
                                        : String(amountArr);
                                    return (
                                        <div key={name} className="flex gap-2 text-sm">
                                            <span className="w-48 shrink-0 font-medium text-muted-foreground capitalize">
                                                {name}
                                            </span>
                                            <span>{amount}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Steps */}
                {r.steps?.length > 0 && (
                    <Card>
                        <CardContent className="p-5 space-y-3">
                            <SectionHeading>Steps ({r.steps.length})</SectionHeading>
                            <ol className="space-y-3">
                                {r.steps.map((step, i) => {
                                    const stepIngredients = step.ingredients
                                        ? Object.entries(step.ingredients)
                                        : [];
                                    return (
                                        <li key={i} className="space-y-1">
                                            <div className="flex gap-3 text-sm">
                                                <span className="shrink-0 font-semibold text-muted-foreground w-6 text-right">
                                                    {i + 1}.
                                                </span>
                                                <span>{step.instruction}</span>
                                            </div>
                                            {stepIngredients.length > 0 && (
                                                <div className="ml-9 flex flex-wrap gap-x-4 gap-y-0.5">
                                                    {stepIngredients.map(([name, amountArr]) => {
                                                        const amount = Array.isArray(amountArr)
                                                            ? `${amountArr[0]} ${amountArr[1] ?? ""}`.trim()
                                                            : String(amountArr);
                                                        return (
                                                            <span key={name} className="text-xs text-muted-foreground">
                                                                {name}: {amount}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ol>
                        </CardContent>
                    </Card>
                )}

                {/* Images */}
                {(() => {
                    const mediaItems = normalizeMediaItems(r.images);
                    if (!mediaItems.length) return null;
                    return (
                        <Card>
                            <CardContent className="p-5 space-y-3">
                                <SectionHeading>Media ({mediaItems.length})</SectionHeading>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {mediaItems.map((item, i) => (
                                        <a
                                            key={i}
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group relative block overflow-hidden rounded-md border border-border bg-muted aspect-square"
                                        >
                                            {item.type === 'video' ? (
                                                <video
                                                    src={item.url}
                                                    className="h-full w-full object-cover"
                                                    muted
                                                    playsInline
                                                />
                                            ) : (
                                                <img
                                                    src={item.url}
                                                    alt={`Image ${i + 1}`}
                                                    className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                                                />
                                            )}
                                            <span className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-black/50 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                                                {item.type === 'video' ? 'Video' : 'Image'} {i + 1}
                                                <IconExternalLink className="size-3" />
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })()}

            </div>

            {/* Confirm dialog for status changes */}
            <ConfirmDialog
                open={!!pendingStatus}
                onOpenChange={(open) => { if (!open) setPendingStatus(null); }}
                title="Change Recipe Status"
                description={`Set this recipe's status to "${pendingStatus}"?`}
                confirmLabel="Confirm"
                onConfirm={handleStatusChange}
                loading={statusLoading}
                variant={pendingStatus === "deleted" ? "destructive" : "default"}
            />
        </div>
    );
}
