"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getRecipesByUser } from "@/lib/db/recipeService";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function RecipeSelector({ username, selectedRecipeId, onSelect }) {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId) ?? null;

    useEffect(() => {
        if (!username) return;
        getRecipesByUser(username)
            .then(({ recipes }) => setRecipes(recipes))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="recipe-select">Select Recipe</Label>
                <div className="relative">
                    <select
                        id="recipe-select"
                        value={selectedRecipeId ?? ""}
                        onChange={(e) => onSelect(e.target.value || null)}
                        className="w-full h-10 rounded-md border border-input bg-white px-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                        disabled={loading}
                    >
                        <option value="">
                            {loading ? "Loading recipes..." : "Select a recipe"}
                        </option>
                        {recipes.map((recipe) => (
                            <option key={recipe.id} value={recipe.id}>
                                {recipe.name}
                            </option>
                        ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">▼</span>
                </div>
                {!loading && recipes.length === 0 && (
                    <p className="text-xs text-muted-foreground">You have no created recipes to attach.</p>
                )}
            </div>

            {/* Recipe preview */}
            {selectedRecipe && (
                <div className="flex flex-col gap-1.5">
                    <Label>Recipe Details</Label>
                    <Card className="bg-white">
                        <CardContent className="flex gap-4 p-4">
                            {/* Image */}
                            {selectedRecipe.images?.[0] && (
                                <div className="relative size-24 shrink-0 overflow-hidden rounded-lg">
                                    <Image
                                        src={selectedRecipe.images[0]}
                                        alt={selectedRecipe.name}
                                        fill
                                        sizes="96px"
                                        className="object-cover"
                                    />
                                </div>
                            )}

                            {/* Instructions */}
                            <Card className="flex-1">
                                <CardContent className="p-3">
                                    <p className="text-xs font-semibold mb-1">Instructions</p>
                                    <ol className="text-xs text-muted-foreground space-y-0.5 list-decimal list-inside">
                                        {selectedRecipe.steps?.slice(0, 3).map((step, i) => (
                                            <li key={i}>{step.instruction}</li>
                                        ))}
                                    </ol>
                                </CardContent>
                            </Card>

                            {/* Ingredients */}
                            <Card className="flex-1">
                                <CardContent className="p-3">
                                    <p className="text-xs font-semibold mb-1">Ingredients</p>
                                    <ul className="text-xs text-muted-foreground space-y-0.5">
                                        {Object.entries(selectedRecipe.ingredients ?? {}).slice(0, 5).map(([name, [amount, unit]]) => (
                                            <li key={name}>{amount}{unit} {name}</li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}