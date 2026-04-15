import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconArrowBigUp, IconClock, IconUsers } from "@tabler/icons-react";

const formatCount = (value) => Number(value ?? 0).toLocaleString();

function RecipeCard({ recipe }) {
    const imageUrl = recipe?.images?.[0] || "https://placehold.co/600x400?text=Recipe";

    return (
        <Card className="overflow-hidden border-border bg-card">
            <div className="relative h-44 w-full">
                <Image src={imageUrl} alt={recipe?.name || "Recipe"} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
            </div>
            <CardContent className="space-y-2 p-4">
                <div>
                    <p className="line-clamp-1 text-base font-semibold text-foreground">{recipe?.name || "Untitled Recipe"}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{recipe?.description || "No description provided."}</p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                        <IconClock className="size-3.5" />
                        {Number(recipe?.time ?? 0)} mins
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <IconUsers className="size-3.5" />
                        {Number(recipe?.servings ?? 0)} servings
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <IconArrowBigUp className="size-3.5" />
                        {formatCount(recipe?.upvotes)} upvotes
                    </span>
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Button asChild className="w-full">
                    <Link href={`/recipes/find?recipeId=${recipe.id}`}>View Recipe</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function RecipeResultsList({ recipes, loading, loadingMore, error, hasMore, onLoadMore }) {
    return (
        <Card className="border-border bg-card">
            <CardContent className="space-y-4 p-5">
                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                {loading ? <p className="text-sm text-muted-foreground">Loading recipes...</p> : null}

                {!loading && recipes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recipes match your current filters.</p>
                ) : null}

                {recipes.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {recipes.map((recipe) => (
                            <RecipeCard key={recipe.id} recipe={recipe} />
                        ))}
                    </div>
                ) : null}

                {hasMore ? (
                    <div className="flex justify-center">
                        <Button onClick={onLoadMore} disabled={loadingMore}>
                            {loadingMore ? "Loading..." : "Load More"}
                        </Button>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
