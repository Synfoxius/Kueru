import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconClock, IconUsers, IconArrowBigUp } from "@tabler/icons-react";

const formatCount = (value) => Number(value ?? 0).toLocaleString();

export default function DiscoverRecipeCard({ recipe }) {
    const imageUrl = recipe?.images?.[0] || "https://placehold.co/600x400?text=Recipe";

    return (
        <Card className="w-[300px] shrink-0 overflow-hidden border-border bg-card">
            <div className="relative h-44 w-full">
                <Image src={imageUrl} alt={recipe?.name || "Recipe"} fill className="object-cover" sizes="300px" />
            </div>
            <CardContent className="space-y-2 px-4 pt-4 pb-0">
                <div>
                    <p className="line-clamp-1 text-base font-semibold text-foreground">{recipe?.name || "Untitled Recipe"}</p>
                    <p className="line-clamp-1 text-sm text-muted-foreground">by {recipe?.username || "Unknown"}</p>
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
                <Button asChild className="w-full">
                    <Link href={`/recipes/${recipe?.id || ""}`}>View Recipe</Link>
                </Button>
            </CardContent>
        </Card>
    );
}
