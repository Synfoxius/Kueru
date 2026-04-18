"use client";

import { useEffect, useState } from "react";
import { IconFlame } from "@tabler/icons-react";

export default function RecipeAiLoadingState({
    messages = [],
    title = "Converting your video",
    description = "This can take a moment while Gemini watches and writes.",
}) {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        if (!Array.isArray(messages) || messages.length <= 1) {
            return undefined;
        }

        const interval = setInterval(() => {
            setMessageIndex((previous) => (previous + 1) % messages.length);
        }, 2200);

        return () => clearInterval(interval);
    }, [messages]);

    const activeMessage = messages[messageIndex] || "Preparing a fresh recipe draft...";

    return (
        <div className="space-y-4 rounded-lg border border-amber-200/70 bg-amber-50/60 p-4 text-center">
            <div className="relative mx-auto h-24 w-24" aria-hidden="true">
                <div className="absolute inset-2 rounded-full bg-amber-200/40 blur-xl animate-pulse motion-reduce:animate-none" />
                <div className="absolute left-1/2 top-4 h-14 w-10 -translate-x-1/2 rounded-[55%_45%_60%_40%] bg-amber-300/60 blur-[1px] animate-pulse motion-reduce:animate-none" />
                <div className="absolute left-1/2 top-8 h-10 w-8 -translate-x-1/2 rounded-[60%_40%_55%_45%] bg-orange-300/70 animate-pulse motion-reduce:animate-none" />
                <div className="absolute left-1/2 top-10 -translate-x-1/2 text-orange-700/80">
                    <IconFlame className="size-8" />
                </div>
            </div>

            <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-900">{title}</p>
                <p className="text-xs text-amber-800/80">{description}</p>
            </div>

            <div className="rounded-md bg-white/80 px-3 py-2 text-sm text-amber-900 transition-opacity duration-300">
                {activeMessage}
            </div>

            <p className="sr-only" role="status" aria-live="polite">
                Gemini is processing your video recipe. {activeMessage}
            </p>
        </div>
    );
}
