"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";

/** Formats a Firestore Timestamp or plain Date into "Jan 15, 2026" */
function formatDate(timestamp) {
    if (!timestamp) return "";
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Displays a single linked recipe card in the achievement detail page.
 * Shows recipe name, creation date, upvote count, and a "View Post" button.
 */
export function LinkedPostCard({ recipe }) {
    return (
        <Card className="transition-colors hover:bg-muted/50 bg-white">
            <CardContent className="p-4 flex flex-col gap-3">
                <div>
                    <p className="text-sm font-semibold leading-snug line-clamp-2">{recipe.name}</p>
                    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                        <span>{formatDate(recipe.createdAt)}</span>
                        <span>{recipe.upvotes ?? 0} likes</span>
                    </div>
                </div>
                <Button asChild size="sm" className="w-full">
                    <Link href={`/recipes/${recipe.id}`}>View Post</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

/**
 * Placeholder card shown as the last item in the linked posts grid
 * when the achievement is not yet completed. Navigates to /recipes/new.
 */
export function AddPostCard() {
    return (
        <Card className="border-dashed">
            <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[120px] gap-2">
                <Link
                    href="/recipes/new"
                    className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-center"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-current">
                        <IconPlus className="size-5" />
                    </div>
                    <span className="text-sm font-medium">Add Post/<br />Record activity</span>
                </Link>
            </CardContent>
        </Card>
    );
}
