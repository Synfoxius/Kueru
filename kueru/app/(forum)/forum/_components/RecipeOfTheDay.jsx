"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getTopRecipes } from "@/lib/db/recipeService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function pickRecipeForToday(recipes) {
    if (!recipes || recipes.length === 0) { return null; }
    const now = new Date();
    const dayOfYear = Math.floor(
        (now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
    );
    return recipes[dayOfYear % recipes.length];
}

export default function RecipeOfTheDay() {
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getTopRecipes(20)
            .then((recipes) => setRecipe(pickRecipeForToday(recipes)))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <Card className="w-full py-0">
                <CardContent className="p-0">
                    <div className="h-44 w-full bg-muted animate-pulse rounded-xl" />
                </CardContent>
            </Card>
        );
    }

    if (!recipe) { return null; }

    return (
        <Card className="relative overflow-hidden w-full py-0">
            <CardContent className="p-0">
                <div className="relative h-44 w-full bg-muted">

                    {recipe.images?.[0] && (
                        <Image
                            src={recipe.images[0]}
                            alt={recipe.name}
                            fill
                            className="object-cover brightness-60"
                        />
                    )}

                    <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                        <span className="w-fit rounded-full bg-yellow-400 px-3 py-0.5 text-xs font-semibold text-black">
                            ★ Recipe of the Day
                        </span>
                        <div>
                            <Link href={`/recipe/${recipe.id}`} className="hover:underline underline-offset-2">
                                <h2 className="text-lg font-bold text-white leading-tight">{recipe.name}</h2>
                            </Link>
                            <Link href={`/profile/${recipe.username}`} className="hover:underline underline-offset-2">
                                <p className="text-xs text-white/60 mt-1">By @{recipe.username}</p>
                            </Link>
                            {recipe.tags?.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {recipe.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Visit button */}
                    <div className="absolute right-4 inset-y-0 flex items-center">
                        <Link href={`/recipe/${recipe.id}`}>
                            <Button size="sm" className="rounded-full">
                                Visit →
                            </Button>
                        </Link>
                    </div>

                </div>
            </CardContent>
        </Card>
    );
}
