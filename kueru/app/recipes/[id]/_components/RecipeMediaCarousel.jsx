import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { normalizeMediaItems } from "@/lib/media";

const FALLBACK_IMAGE = "https://placehold.co/1200x700?text=Recipe";

export default function RecipeMediaCarousel({ images = [], recipeName = "Recipe" }) {
    const mediaItems = useMemo(() => {
        const normalized = normalizeMediaItems(images);
        return normalized.length > 0 ? normalized : [{ url: FALLBACK_IMAGE, type: "image" }];
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
                        <CarouselItem key={`${item.url}-${index}`} className="pl-0">
                            <div className="relative overflow-hidden rounded-xl">
                                <div className="relative aspect-[16/9] w-full bg-muted">
                                    {item.type === "video" ? (
                                        <video
                                            src={item.url}
                                            controls
                                            playsInline
                                            className="absolute inset-0 h-full w-full object-cover"
                                            aria-label={`${recipeName} video ${index + 1}`}
                                        />
                                    ) : (
                                        <Image
                                            src={item.url}
                                            alt={`${recipeName} image ${index + 1}`}
                                            fill
                                            sizes="(max-width: 1024px) 100vw, 960px"
                                            className="object-cover"
                                        />
                                    )}
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
                            aria-label="Previous recipe media"
                        />
                        <CarouselNext
                            variant="secondary"
                            className="-right-5 top-1/2 -translate-y-1/2"
                            aria-label="Next recipe media"
                        />
                    </>
                ) : null}
            </Carousel>

            {mediaItems.length > 1 && (
                <div className="flex items-center justify-center gap-1.5">
                    {mediaItems.map((item, index) => (
                        <button
                            key={`${item.url}-${index}`}
                            type="button"
                            className={`h-2.5 w-2.5 rounded-full transition ${
                                index === activeIndex ? "bg-primary" : "bg-border"
                            }`}
                            onClick={() => api?.scrollTo(index)}
                            aria-label={`Show ${item.type} ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
