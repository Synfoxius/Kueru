"use client";

import Image from "next/image";
import Link from "next/link";
import { IconClock, IconUsers, IconArrowUp } from "@tabler/icons-react";
import { getPreviewImageUrl } from "@/lib/media";

export default function RecipePreviewCard({ recipe, linkable = false }) {
    const name = linkable ? (
        <Link href={`/recipes/${recipe.id}`} className="hover:text-primary hover:underline transition-colors">
            {recipe.name}
        </Link>
    ) : recipe.name;

    const imageUrl = getPreviewImageUrl(recipe.images, null);

    return (
        <div className="rounded-xl border border-border overflow-hidden bg-white shadow-sm">

            {/* Hero image */}
            {imageUrl ? (
                <div className="relative w-full h-40">
                    <Image
                        src={imageUrl}
                        alt={recipe.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 672px"
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <h3 className="absolute bottom-3 left-4 text-base font-bold text-white leading-snug">
                        {name}
                    </h3>
                </div>
            ) : (
                <div className="px-4 pt-4">
                    <h3 className="text-base font-bold text-foreground">{name}</h3>
                </div>
            )}

            <div className="p-4 flex flex-col gap-4">

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {recipe.time && (
                        <span className="flex items-center gap-1">
                            <IconClock className="size-3.5 shrink-0" />
                            {recipe.time} min
                        </span>
                    )}
                    {recipe.servings && (
                        <span className="flex items-center gap-1">
                            <IconUsers className="size-3.5 shrink-0" />
                            {recipe.servings} servings
                        </span>
                    )}
                    {recipe.upvotes > 0 && (
                        <span className="flex items-center gap-1">
                            <IconArrowUp className="size-3.5 shrink-0" />
                            {recipe.upvotes}
                        </span>
                    )}
                </div>

                {/* Tags */}
                {recipe.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {recipe.tags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Ingredients + Steps */}
                <div className="grid grid-cols-2 gap-3">

                    {/* Ingredients */}
                    <div className="flex flex-col gap-2">
                        <p className="text-xs font-semibold text-foreground">Ingredients</p>
                        <ul className="flex flex-col gap-1">
                            {Object.entries(recipe.ingredients ?? {}).slice(0, 6).map(([name, [amount, unit]]) => (
                                <li key={name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span className="size-1 rounded-full bg-primary/40 shrink-0" />
                                    <span className="font-medium text-foreground">{amount}{unit ? ` ${unit}` : ""}</span>
                                    {name}
                                </li>
                            ))}
                            {Object.keys(recipe.ingredients ?? {}).length > 6 && (
                                <li className="text-xs text-muted-foreground pl-2.5">
                                    +{Object.keys(recipe.ingredients).length - 6} more
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Steps */}
                    <div className="flex flex-col gap-2">
                        <p className="text-xs font-semibold text-foreground">Steps</p>
                        <ol className="flex flex-col gap-1.5">
                            {recipe.steps?.slice(0, 4).map((step, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                    <span className="flex items-center justify-center size-4 rounded-full bg-primary/10 text-primary font-semibold shrink-0 mt-0.5 text-[10px]">
                                        {i + 1}
                                    </span>
                                    <span className="line-clamp-2">{step.instruction}</span>
                                </li>
                            ))}
                            {recipe.steps?.length > 4 && (
                                <li className="text-xs text-muted-foreground pl-5">
                                    +{recipe.steps.length - 4} more steps
                                </li>
                            )}
                        </ol>
                    </div>

                </div>

            </div>
        </div>
    );
}
