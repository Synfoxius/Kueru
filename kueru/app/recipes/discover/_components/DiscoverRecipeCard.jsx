import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconClock, IconUsers, IconArrowBigUp, IconVideo } from "@tabler/icons-react";
import { getFirstMediaItem } from "@/lib/media";

const FALLBACK_IMAGE = "https://placehold.co/600x400?text=Recipe";

const formatCount = (value) => Number(value ?? 0).toLocaleString();

function RecipeBanner({ images, name }) {
    const first = getFirstMediaItem(images);

    if (!first) {
        return (
            <Image
                src={FALLBACK_IMAGE}
                alt={name || "Recipe"}
                fill
                className="object-cover"
                sizes="300px"
            />
        );
    }

    if (first.type === "video") {
        return (
            <>
                <video
                    src={first.url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                    aria-label={`${name || "Recipe"} video preview`}
                />
                {/* Video badge */}
                <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                    <IconVideo className="size-3" />
                    Video
                </span>
            </>
        );
    }

    return (
        <Image
            src={first.url}
            alt={name || "Recipe"}
            fill
            className="object-cover"
            sizes="300px"
        />
    );
}

export default function DiscoverRecipeCard({ recipe }) {
    return (
        <Card className="w-[300px] shrink-0 overflow-hidden border-border bg-card py-0">
            <div className="relative h-44 w-full bg-muted">
                <RecipeBanner images={recipe?.images} name={recipe?.name} />
            </div>
            <CardContent className="space-y-2 px-4 pt-4 pb-4">
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
