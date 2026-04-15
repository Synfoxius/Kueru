import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

const FALLBACK_IMAGE = "https://placehold.co/1200x700?text=Recipe";

export default function RecipeMediaCarousel({ images = [], recipeName = "Recipe" }) {
    const mediaItems = useMemo(() => {
        if (!Array.isArray(images) || images.length === 0) {
            return [FALLBACK_IMAGE];
        }

        return images.filter(Boolean).length > 0 ? images.filter(Boolean) : [FALLBACK_IMAGE];
    }, [images]);

    const [api, setApi] = useState();
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (!api) {
            return;
        }

        const syncSelectedIndex = () => {
            setActiveIndex(api.selectedScrollSnap());
        };

        syncSelectedIndex();
        api.on("select", syncSelectedIndex);
        api.on("reInit", syncSelectedIndex);

        return () => {
            api.off("select", syncSelectedIndex);
            api.off("reInit", syncSelectedIndex);
        };
    }, [api]);

    return (
        <div className="space-y-3">
            <Carousel setApi={setApi} opts={{ loop: mediaItems.length > 1 }} className="w-full">
                <CarouselContent className="-ml-0">
                    {mediaItems.map((item, index) => (
                        <CarouselItem key={`${item}-${index}`} className="pl-0">
                            <div className="relative overflow-hidden rounded-xl">
                                <div className="relative aspect-[16/9] w-full bg-muted">
                                    <Image
                                        src={item}
                                        alt={`${recipeName} image ${index + 1}`}
                                        fill
                                        sizes="(max-width: 1024px) 100vw, 960px"
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                {mediaItems.length > 1 ? (
                    <>
                        <CarouselPrevious
                            variant="secondary"
                            className="-left-5 top-1/2 -translate-y-1/2"
                            aria-label="Previous recipe image"
                        />
                        <CarouselNext
                            variant="secondary"
                            className="-right-5 top-1/2 -translate-y-1/2"
                            aria-label="Next recipe image"
                        />
                    </>
                ) : null}
            </Carousel>

            {mediaItems.length > 1 && (
                <div className="flex items-center justify-center gap-1.5">
                    {mediaItems.map((item, index) => (
                        <button
                            key={`${item}-${index}`}
                            type="button"
                            className={`h-2.5 w-2.5 rounded-full transition ${
                                index === activeIndex ? "bg-primary" : "bg-border"
                            }`}
                            onClick={() => api?.scrollTo(index)}
                            aria-label={`Show image ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
