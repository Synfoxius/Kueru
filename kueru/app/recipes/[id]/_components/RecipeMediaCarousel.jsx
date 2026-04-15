import { useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

const FALLBACK_IMAGE = "https://placehold.co/1200x700?text=Recipe";

export default function RecipeMediaCarousel({ images = [], recipeName = "Recipe" }) {
    const mediaItems = useMemo(() => {
        if (!Array.isArray(images) || images.length === 0) {
            return [FALLBACK_IMAGE];
        }

        return images.filter(Boolean).length > 0 ? images.filter(Boolean) : [FALLBACK_IMAGE];
    }, [images]);

    const [activeIndex, setActiveIndex] = useState(0);

    const goPrevious = () => {
        setActiveIndex((previous) => (previous === 0 ? mediaItems.length - 1 : previous - 1));
    };

    const goNext = () => {
        setActiveIndex((previous) => (previous === mediaItems.length - 1 ? 0 : previous + 1));
    };

    return (
        <div className="space-y-3">
            <div className="relative overflow-hidden rounded-xl">
                <div className="relative aspect-[16/9] w-full bg-muted">
                    <Image
                        src={mediaItems[activeIndex]}
                        alt={`${recipeName} image ${activeIndex + 1}`}
                        fill
                        sizes="(max-width: 1024px) 100vw, 960px"
                        className="object-cover"
                    />
                </div>
                {mediaItems.length > 1 && (
                    <>
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            onClick={goPrevious}
                            className="absolute left-3 top-1/2 -translate-y-1/2"
                            aria-label="Previous recipe image"
                        >
                            <IconChevronLeft className="size-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            onClick={goNext}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                            aria-label="Next recipe image"
                        >
                            <IconChevronRight className="size-4" />
                        </Button>
                    </>
                )}
            </div>

            {mediaItems.length > 1 && (
                <div className="flex items-center justify-center gap-1.5">
                    {mediaItems.map((item, index) => (
                        <button
                            key={`${item}-${index}`}
                            type="button"
                            className={`h-2.5 w-2.5 rounded-full transition ${
                                index === activeIndex ? "bg-primary" : "bg-border"
                            }`}
                            onClick={() => setActiveIndex(index)}
                            aria-label={`Show image ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
