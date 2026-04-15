"use client";

import { useEffect, useState } from "react";
import { getRecipesByUser } from "@/lib/db/recipeService";
import { Label } from "@/components/ui/label";
import { IconChefHat } from "@tabler/icons-react";
import RecipePreviewCard from "@/app/(forum)/forum/_components/RecipePreviewCard";

export default function RecipeSelector({ userId, selectedRecipeId, onSelect }) {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId) ?? null;

    useEffect(() => {
        if (!userId) { return; }
        getRecipesByUser(userId)
            .then(({ recipes }) => setRecipes(recipes))
            .finally(() => setLoading(false));
    }, [userId]);

    return (
        <div className="flex flex-col gap-4">

            {/* Dropdown */}
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="recipe-select">Select Recipe</Label>
                <div className="relative">
                    <IconChefHat className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <select
                        id="recipe-select"
                        value={selectedRecipeId ?? ""}
                        onChange={(e) => onSelect(e.target.value || null)}
                        className="w-full h-10 rounded-md border border-input bg-white pl-9 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none transition-colors"
                        disabled={loading}
                    >
                        <option value="">
                            {loading ? "Loading recipes..." : "Select a recipe to attach"}
                        </option>
                        {recipes.map((recipe) => (
                            <option key={recipe.id} value={recipe.id}>
                                {recipe.name}
                            </option>
                        ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">▼</span>
                </div>
                {!loading && recipes.length === 0 && (
                    <p className="text-xs text-muted-foreground">You have no recipes to attach.</p>
                )}
            </div>

            {/* Recipe preview */}
            {selectedRecipe && <RecipePreviewCard recipe={selectedRecipe} />}
        </div>
    );
}
