"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { IconTrash, IconUpload } from "@tabler/icons-react";
import { MAX_MEDIA_FILES, MAX_MEDIA_SIZE_BYTES } from "../_constants";

const getMediaType = (file) => {
    if (file.type.startsWith("video/")) {
        return "video";
    }
    return "image";
};

const uploadFile = async (file, userId, onProgress) => {
    const filename = `${Date.now()}_${file.name}`;
    const mediaRef = ref(storage, `recipe_media/${userId}/${filename}`);

    const snapshot = await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(mediaRef, file);
        task.on(
            "state_changed",
            (state) => {
                const progress = Math.round((state.bytesTransferred / state.totalBytes) * 100);
                onProgress(progress);
            },
            reject,
            () => resolve(task.snapshot)
        );
    });

    return getDownloadURL(snapshot.ref);
};

export default function RecipeMediaSection({
    userId,
    mediaItems,
    onMediaItemsChange,
    error,
}) {
    const inputRef = useRef(null);
    const [uploadError, setUploadError] = useState("");
    const [pending, setPending] = useState([]);

    const canAddMore = mediaItems.length + pending.length < MAX_MEDIA_FILES;

    const pendingById = useMemo(() => {
        return pending.reduce((accumulator, item) => {
            accumulator[item.id] = item;
            return accumulator;
        }, {});
    }, [pending]);

    const handleFilesSelected = async (event) => {
        const selectedFiles = Array.from(event.target.files ?? []);
        event.target.value = "";

        if (!selectedFiles.length || !canAddMore) {
            return;
        }

        const availableSlots = MAX_MEDIA_FILES - mediaItems.length - pending.length;
        const filesToUpload = selectedFiles.slice(0, availableSlots);

        const oversizedFile = filesToUpload.find((file) => file.size > MAX_MEDIA_SIZE_BYTES);
        if (oversizedFile) {
            setUploadError(`File \"${oversizedFile.name}\" exceeds 15MB.`);
            return;
        }

        setUploadError("");

        const pendingItems = filesToUpload.map((file) => ({
            id: `${file.name}-${file.lastModified}`,
            name: file.name,
            progress: 0,
        }));
        setPending((previous) => [...previous, ...pendingItems]);

        try {
            const uploaded = await Promise.all(
                filesToUpload.map(async (file) => {
                    const pendingId = `${file.name}-${file.lastModified}`;
                    const url = await uploadFile(file, userId, (progress) => {
                        setPending((previous) => previous.map((item) => (
                            item.id === pendingId ? { ...item, progress } : item
                        )));
                    });

                    return {
                        id: `${pendingId}-uploaded-${Date.now()}`,
                        name: file.name,
                        type: getMediaType(file),
                        url,
                    };
                })
            );

            onMediaItemsChange([...mediaItems, ...uploaded]);
        } catch {
            setUploadError("Upload failed. Please try again.");
        } finally {
            setPending((previous) => previous.filter((item) => !pendingItems.some((pendingItem) => pendingItem.id === item.id)));
        }
    };

    const handleRemoveMedia = (id) => {
        onMediaItemsChange(mediaItems.filter((item) => item.id !== id));
    };

    return (
        <section className="space-y-3">
            <div className="space-y-1.5">
                <p className="text-sm font-medium text-foreground">Video/Images <span className="text-primary">*</span></p>
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={!canAddMore}
                    className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border border-input bg-white px-4 py-10 text-center transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-70"
                >
                    <IconUpload className="size-6 text-primary" />
                    <span className="text-sm text-foreground">Click to upload media</span>
                    <span className="text-xs text-muted-foreground">Images or videos</span>
                    <span className="text-[11px] text-muted-foreground">Up to {MAX_MEDIA_FILES} files, 15MB each</span>
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleFilesSelected}
                />
                {error ? <p className="text-xs text-destructive">{error}</p> : null}
                {uploadError ? <p className="text-xs text-destructive">{uploadError}</p> : null}
            </div>

            {pending.length > 0 ? (
                <div className="rounded-lg border border-input bg-white p-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Uploading</p>
                    <div className="space-y-2">
                        {pending.map((item) => (
                            <div key={item.id} className="flex items-center gap-3">
                                <span className="w-24 truncate text-xs text-foreground">{item.name}</span>
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                    <div className="h-full bg-primary transition-all" style={{ width: `${pendingById[item.id]?.progress ?? 0}%` }} />
                                </div>
                                <span className="w-10 text-right text-xs text-muted-foreground">{pendingById[item.id]?.progress ?? 0}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {mediaItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {mediaItems.map((item) => (
                        <div key={item.id} className="relative overflow-hidden rounded-lg border border-input bg-white">
                            {item.type === "video" ? (
                                <video src={item.url} className="h-24 w-full object-cover" muted />
                            ) : (
                                <Image src={item.url} alt={item.name} width={200} height={96} className="h-24 w-full object-cover" />
                            )}
                            <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                                <span className="truncate text-[11px] text-muted-foreground">{item.name}</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveMedia(item.id)}
                                    className="size-6 text-destructive hover:text-destructive"
                                >
                                    <IconTrash className="size-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}
        </section>
    );
}
