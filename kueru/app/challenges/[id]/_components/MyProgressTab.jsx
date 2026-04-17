"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRecipesByIds } from "@/lib/db/recipeService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatDate(timestamp) {
    if (!timestamp) return "";
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function RecipeCard({ recipe }) {
    return (
        <Card className="bg-white transition-colors hover:bg-muted/50">
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
 * "My Progress" tab — shows the recipes this user contributed to the challenge.
 *
 * Props:
 *   linkedRecipeIds  string[]  IDs of recipes this user contributed
 *   joined           boolean   whether the user has joined the challenge
 *   active           boolean   whether the challenge is currently active
 */
export default function MyProgressTab({ linkedRecipeIds = [], joined, active }) {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setLoading(true);
            const data = linkedRecipeIds.length ? await getRecipesByIds(linkedRecipeIds) : [];
            if (isMounted) { setRecipes(data); setLoading(false); }
        };
        load();
        return () => { isMounted = false; };
    }, [linkedRecipeIds]);

    if (!joined) {
        return (
            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                <p className="text-sm">Join this challenge to start contributing and tracking your progress.</p>
                {active && (
                    <Button asChild variant="outline" size="sm">
                        <Link href="/recipes/new">Post a Recipe</Link>
                    </Button>
                )}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                Loading...
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-lg font-bold mb-1">My Progress ({recipes.length})</h2>
            <p className="text-sm text-muted-foreground mb-4">
                All the posts you've contributed to this challenge
            </p>

            {recipes.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                    <p className="text-sm">No contributions yet. Post a qualifying recipe to get started!</p>
                    {active && (
                        <Button asChild size="sm">
                            <Link href="/recipes/new">Post a Recipe</Link>
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-4">
                    {recipes.map((recipe) => (
                        <RecipeCard key={recipe.id} recipe={recipe} />
                    ))}
                </div>
            )}
        </div>
    );
}
