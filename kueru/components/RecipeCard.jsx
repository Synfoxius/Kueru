import Link from "next/link";
import Image from "next/image";
import { getFirstMediaItem } from "@/lib/media";

/**
 * Reusable recipe grid card.
 * Shows the first media item (image or video) if available, otherwise a placeholder icon.
 * Recipe name is displayed in a semi-transparent overlay at the bottom.
 */
export default function RecipeCard({ recipe }) {
    const firstMedia = getFirstMediaItem(recipe.images);

    return (
        <Link href={`/recipes/${recipe.id}`} className="block">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-primary cursor-pointer group">
                {firstMedia ? (
                    firstMedia.type === "video" ? (
                        <video
                            src={firstMedia.url}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <Image
                            src={firstMedia.url}
                            alt={recipe.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    )
                ) : (
                    <div className="flex h-full items-center justify-center text-5xl select-none">
                        🍽️
                    </div>
                )}
                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-2">
                    <p className="truncate text-sm font-medium text-white">{recipe.name}</p>
                </div>
            </div>
        </Link>
    );
}
