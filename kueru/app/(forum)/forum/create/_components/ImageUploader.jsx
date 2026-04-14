"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/config";
import { IconX, IconCloudUpload, IconPhoto, IconBrandYoutube, IconAlertCircle } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_IMAGES = 4;

async function uploadToStorage(file, userId, onProgress) {
    const filename = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `forum_images/${userId}/${filename}`);
    const snapshot = await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, file);
        task.on(
            "state_changed",
            (s) => onProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
            reject,
            () => resolve(task.snapshot)
        );
    });
    return getDownloadURL(snapshot.ref);
}

function parseVideoURL(url) {
    if (!url) { return null; }

    // YouTube: youtube.com/watch?v=ID or youtu.be/ID or youtube.com/shorts/ID
    const ytMatch = url.match(
        /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    if (ytMatch) { return { platform: "youtube", id: ytMatch[1] }; }

    // Vimeo: vimeo.com/ID
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) { return { platform: "vimeo", id: vimeoMatch[1] }; }

    return null;
}

export default function ImageUploader({ userId, imageURLs, onChange, videoEmbed, onVideoChange }) {
    const [pending, setPending] = useState([]);
    const [videoInput, setVideoInput] = useState("");
    const [videoError, setVideoError] = useState("");

    const onDrop = useCallback(async (acceptedFiles) => {
        const remaining = MAX_IMAGES - imageURLs.length;
        const filesToUpload = acceptedFiles.slice(0, remaining);

        const newPending = filesToUpload.map((file) => ({
            file,
            progress: 0,
            preview: URL.createObjectURL(file),
        }));
        setPending((prev) => [...prev, ...newPending]);

        const urls = await Promise.all(
            filesToUpload.map((file) =>
                uploadToStorage(file, userId, (progress) => {
                    setPending((prev) =>
                        prev.map((p) => (p.file === file ? { ...p, progress } : p))
                    );
                }).then((url) => {
                    setPending((prev) => prev.filter((p) => p.file !== file));
                    return url;
                })
            )
        );
        onChange([...imageURLs, ...urls]);
    }, [imageURLs, onChange, userId]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [] },
        disabled: imageURLs.length >= MAX_IMAGES,
    });

    const handleRemoveImage = (index) => {
        onChange(imageURLs.filter((_, i) => i !== index));
    };

    const handleVideoInputChange = (e) => {
        const val = e.target.value;
        setVideoInput(val);
        setVideoError("");

        if (!val.trim()) {
            onVideoChange(null);
            return;
        }

        const parsed = parseVideoURL(val.trim());
        if (parsed) {
            onVideoChange(parsed);
        } else {
            onVideoChange(null);
            setVideoError("Unrecognised URL — paste a YouTube or Vimeo link.");
        }
    };

    const handleClearVideo = () => {
        setVideoInput("");
        setVideoError("");
        onVideoChange(null);
    };

    const atImageLimit = imageURLs.length >= MAX_IMAGES;
    const hasImages = imageURLs.length > 0 || pending.length > 0;

    return (
        <div className="flex flex-col gap-5">

            {/* ── Images ── */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                        Photos <span className="text-muted-foreground/50">(up to {MAX_IMAGES})</span>
                    </Label>
                    {atImageLimit && (
                        <span className="text-xs text-muted-foreground">Max images reached</span>
                    )}
                </div>

                {/* Dropzone */}
                <div
                    {...getRootProps()}
                    className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all duration-200 ${
                        atImageLimit
                            ? "border-input bg-muted opacity-50 cursor-not-allowed"
                            : isDragActive
                            ? "border-primary bg-primary/5 scale-[1.01] cursor-pointer"
                            : "border-input bg-white hover:border-primary hover:bg-primary/5 cursor-pointer"
                    }`}
                >
                    <input {...getInputProps()} />
                    <div className={`flex items-center justify-center size-10 rounded-full transition-colors ${isDragActive ? "bg-primary/10" : "bg-muted"}`}>
                        {isDragActive
                            ? <IconCloudUpload className="size-5 text-primary" />
                            : <IconPhoto className="size-5 text-muted-foreground" />
                        }
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {isDragActive ? "Release to upload" : "Drop images here or "}
                            {!isDragActive && <span className="text-primary underline underline-offset-2">browse</span>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, GIF, WEBP · Max 10MB each</p>
                    </div>
                </div>

                {/* Thumbnails */}
                {hasImages && (
                    <div className="grid grid-cols-4 gap-2">
                        {imageURLs.map((url, i) => (
                            <div key={url} className="group relative aspect-square rounded-lg overflow-hidden border border-input shadow-sm">
                                <Image
                                    src={url}
                                    alt={`Image ${i + 1}`}
                                    fill
                                    sizes="(max-width: 672px) 25vw, 160px"
                                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200" />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(i)}
                                    className="absolute top-1.5 right-1.5 flex items-center justify-center size-6 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black"
                                    aria-label="Remove image"
                                >
                                    <IconX className="size-3.5" />
                                </button>
                                <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white font-medium leading-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    {i + 1}
                                </span>
                            </div>
                        ))}
                        {pending.map(({ preview, progress, file }) => (
                            <div key={file.name + file.lastModified} className="relative aspect-square rounded-lg overflow-hidden border border-input shadow-sm">
                                <Image
                                    src={preview}
                                    alt="Uploading"
                                    fill
                                    sizes="(max-width: 672px) 25vw, 160px"
                                    className="object-cover opacity-50"
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40">
                                    <svg className="size-8 -rotate-90" viewBox="0 0 32 32">
                                        <circle cx="16" cy="16" r="12" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="3" />
                                        <circle
                                            cx="16" cy="16" r="12"
                                            fill="none"
                                            stroke="white"
                                            strokeWidth="3"
                                            strokeDasharray={`${2 * Math.PI * 12}`}
                                            strokeDashoffset={`${2 * Math.PI * 12 * (1 - progress / 100)}`}
                                            strokeLinecap="round"
                                            className="transition-all duration-200"
                                        />
                                    </svg>
                                    <span className="text-[10px] text-white font-semibold">{progress}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Video ── */}
            <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">
                    Video <span className="text-muted-foreground/50">(YouTube or Vimeo link)</span>
                </Label>

                <div className="relative">
                    <IconBrandYoutube className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={videoInput}
                        onChange={handleVideoInputChange}
                        className={`pl-9 pr-8 bg-background ${videoError ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
                    />
                    {videoInput && (
                        <button
                            type="button"
                            onClick={handleClearVideo}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <IconX className="size-3.5" />
                        </button>
                    )}
                </div>

                {/* Error */}
                {videoError && (
                    <p className="flex items-center gap-1.5 text-xs text-destructive">
                        <IconAlertCircle className="size-3.5 shrink-0" />
                        {videoError}
                    </p>
                )}

                {/* Preview */}
                {videoEmbed && (
                    <div className="rounded-xl overflow-hidden border border-border aspect-video mt-1">
                        <iframe
                            src={
                                videoEmbed.platform === "youtube"
                                    ? `https://www.youtube.com/embed/${videoEmbed.id}`
                                    : `https://player.vimeo.com/video/${videoEmbed.id}`
                            }
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                )}
            </div>

        </div>
    );
}
