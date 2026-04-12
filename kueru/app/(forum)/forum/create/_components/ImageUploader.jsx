"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/config";
import { IconX, IconCloudUpload, IconPhoto } from "@tabler/icons-react";

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

export default function ImageUploader({ userId, imageURLs, onChange }) {
    // Track per-file upload progress: [{ file, progress, preview }]
    const [pending, setPending] = useState([]);

    const onDrop = useCallback(async (acceptedFiles) => {
        const newPending = acceptedFiles.map((file) => ({
            file,
            progress: 0,
            preview: URL.createObjectURL(file),
        }));
        setPending((prev) => [...prev, ...newPending]);

        const urls = await Promise.all(
            acceptedFiles.map((file) =>
                uploadToStorage(file, userId, (progress) => {
                    setPending((prev) =>
                        prev.map((p) =>
                            p.file === file ? { ...p, progress } : p
                        )
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
    });

    const handleRemove = (index) => {
        onChange(imageURLs.filter((_, i) => i !== index));
    };

    const hasContent = imageURLs.length > 0 || pending.length > 0;

    return (
        <div className="flex flex-col gap-3">

            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-all duration-200 ${
                    isDragActive
                        ? "border-primary bg-primary/5 scale-[1.01]"
                        : "border-input bg-white hover:border-primary hover:bg-primary/5"
                }`}
            >
                <input {...getInputProps()} />
                <div className={`flex items-center justify-center size-12 rounded-full transition-colors ${isDragActive ? "bg-primary/10" : "bg-muted"}`}>
                    {isDragActive
                        ? <IconCloudUpload className="size-6 text-primary" />
                        : <IconPhoto className="size-6 text-muted-foreground" />
                    }
                </div>
                <div>
                    <p className="text-sm font-medium text-foreground">
                        {isDragActive ? "Release to upload" : "Drop images here or "}
                        {!isDragActive && (
                            <span className="text-primary underline underline-offset-2">browse</span>
                        )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, GIF, WEBP · Max 10MB each</p>
                </div>
            </div>

            {/* Uploaded + pending thumbnails */}
            {hasContent && (
                <div className="grid grid-cols-4 gap-2">

                    {/* Uploaded */}
                    {imageURLs.map((url, i) => (
                        <div key={url} className="group relative aspect-square rounded-lg overflow-hidden border border-input shadow-sm">
                            <Image
                                src={url}
                                alt={`Image ${i + 1}`}
                                fill
                                sizes="(max-width: 672px) 25vw, 160px"
                                className="object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200" />
                            {/* Remove button */}
                            <button
                                type="button"
                                onClick={() => handleRemove(i)}
                                className="absolute top-1.5 right-1.5 flex items-center justify-center size-6 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black"
                                aria-label="Remove image"
                            >
                                <IconX className="size-3.5" />
                            </button>
                            {/* Index badge */}
                            <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white font-medium leading-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                {i + 1}
                            </span>
                        </div>
                    ))}

                    {/* Uploading */}
                    {pending.map(({ preview, progress, file }) => (
                        <div key={file.name + file.lastModified} className="relative aspect-square rounded-lg overflow-hidden border border-input shadow-sm">
                            <Image
                                src={preview}
                                alt="Uploading"
                                fill
                                sizes="(max-width: 672px) 25vw, 160px"
                                className="object-cover opacity-50"
                            />
                            {/* Progress overlay */}
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
    );
}