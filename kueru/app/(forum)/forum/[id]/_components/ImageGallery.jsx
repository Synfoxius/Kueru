"use client";

import { useState } from "react";
import Image from "next/image";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

export default function ImageGallery({ images, title }) {
    const [activeIndex, setActiveIndex] = useState(0);

    if (!images || images.length === 0) { return null; }

    const goPrev = () => setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
    const goNext = () => setActiveIndex((prev) => (prev + 1) % images.length);

    return (
        <div className="flex flex-col gap-2">

            {/* Main image */}
            <div className="relative w-full aspect-video bg-muted rounded-xl overflow-hidden border border-border">
                <Image
                    key={activeIndex}
                    src={images[activeIndex]}
                    alt={`${title} — image ${activeIndex + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-cover transition-opacity duration-200"
                    priority={activeIndex === 0}
                />

                {/* Prev / next arrows — only shown when more than 1 image */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={goPrev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-8 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                            aria-label="Previous image"
                        >
                            <IconChevronLeft className="size-4" />
                        </button>
                        <button
                            onClick={goNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-8 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                            aria-label="Next image"
                        >
                            <IconChevronRight className="size-4" />
                        </button>

                        {/* Counter */}
                        <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white font-medium tabular-nums">
                            {activeIndex + 1} / {images.length}
                        </span>
                    </>
                )}
            </div>

            {/* Thumbnails — only shown when more than 1 image */}
            {images.length > 1 && (
                <div className="flex gap-2">
                    {images.map((url, i) => (
                        <button
                            key={url}
                            onClick={() => setActiveIndex(i)}
                            className={`relative size-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                                i === activeIndex
                                    ? "border-primary shadow-sm"
                                    : "border-transparent opacity-60 hover:opacity-100"
                            }`}
                            aria-label={`View image ${i + 1}`}
                        >
                            <Image
                                src={url}
                                alt={`Thumbnail ${i + 1}`}
                                fill
                                sizes="64px"
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

        </div>
    );
}
