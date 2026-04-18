"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { IconSparkles } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { storage } from "@/lib/firebase/config";
import { convertVideoToRecipe } from "@/lib/ai/vertexRecipeConverter";
import { normalizeAiRecipe } from "../_utils/aiRecipeNormalizer";
import {
    AI_COOKING_LOADING_MESSAGES,
    MAX_CONVERSION_VIDEO_SIZE_BYTES,
    SUPPORTED_CONVERSION_VIDEO_MIME_TYPES,
} from "../_constants";
import RecipeAiLoadingState from "./RecipeAiLoadingState";

const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i;

const uploadVideoForConversion = async ({ file, userId, onProgress }) => {
    const filename = `${Date.now()}_${file.name}`;
    const storagePath = `recipe_video_conversion/${userId}/${filename}`;
    const videoRef = ref(storage, storagePath);

    const snapshot = await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(videoRef, file);
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

    const downloadUrl = await getDownloadURL(snapshot.ref);

    return {
        downloadUrl,
        storagePath,
    };
};

export default function VideoConverterDialog({
    open,
    onOpenChange,
    userId,
    onRecipeConverted,
    onConvertingChange,
}) {
    const fileInputRef = useRef(null);
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isConverting, setIsConverting] = useState(false);

    const isBusy = isConverting;
    const hasUrl = youtubeUrl.trim().length > 0;
    const hasFile = Boolean(selectedFile);

    const validationError = useMemo(() => {
        if (hasUrl && hasFile) {
            return "Choose either a YouTube link or a video file, not both.";
        }

        if (!hasUrl && !hasFile) {
            return "Provide either a YouTube link or upload a video file.";
        }

        if (hasUrl && !YOUTUBE_URL_REGEX.test(youtubeUrl.trim())) {
            return "Please provide a valid YouTube URL.";
        }

        return "";
    }, [hasFile, hasUrl, youtubeUrl]);

    useEffect(() => {
        onConvertingChange?.(isConverting);
    }, [isConverting, onConvertingChange]);

    useEffect(() => {
        if (!open) {
            setYoutubeUrl("");
            setSelectedFile(null);
            setError("");
            setUploadProgress(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }, [open]);

    const handlePickFile = (event) => {
        const file = event.target.files?.[0] || null;
        if (!file) {
            setSelectedFile(null);
            return;
        }

        if (!SUPPORTED_CONVERSION_VIDEO_MIME_TYPES.includes(file.type)) {
            setError("Unsupported video format. Please upload MP4, MOV, WEBM, AVI, MKV, or MPEG.");
            setSelectedFile(null);
            event.target.value = "";
            return;
        }

        if (file.size > MAX_CONVERSION_VIDEO_SIZE_BYTES) {
            setError("Video file exceeds 100MB.");
            setSelectedFile(null);
            event.target.value = "";
            return;
        }

        setError("");
        setSelectedFile(file);
    };

    const handleConvert = async () => {
        if (isBusy) {
            return;
        }

        if (!userId) {
            setError("You must be signed in to use video conversion.");
            return;
        }

        if (validationError) {
            setError(validationError);
            return;
        }

        setError("");
        setUploadProgress(0);
        setIsConverting(true);

        let uploadedStoragePath = null;

        try {
            let videoUrl = youtubeUrl.trim();
            let videoMimeType = "video/mp4";
            const isYouTubeUrl = Boolean(videoUrl);

            if (!isYouTubeUrl && selectedFile) {
                const uploadResult = await uploadVideoForConversion({
                    file: selectedFile,
                    userId,
                    onProgress: setUploadProgress,
                });

                videoUrl = uploadResult.downloadUrl;
                videoMimeType = selectedFile.type;
                uploadedStoragePath = uploadResult.storagePath;
            }

            const aiRecipe = await convertVideoToRecipe({
                videoUrl,
                isYouTubeUrl,
                videoMimeType,
            });

            const normalizedRecipe = normalizeAiRecipe(aiRecipe);

            if (!normalizedRecipe.recipeName) {
                throw new Error("Gemini did not return a valid recipe name. Please try again.");
            }

            await Promise.resolve(onRecipeConverted?.(normalizedRecipe));

            if (uploadedStoragePath) {
                await deleteObject(ref(storage, uploadedStoragePath));
            }

            onOpenChange(false);
        } catch (conversionError) {
            setError(conversionError?.message || "Unable to convert this video right now.");
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (isBusy) {
                    return;
                }
                onOpenChange(nextOpen);
            }}
        >
            <DialogContent
                className="convert-video-modal-shimmer sm:max-w-lg"
                showCloseButton={!isBusy}
                onInteractOutside={(event) => {
                    if (isBusy) {
                        event.preventDefault();
                    }
                }}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <IconSparkles className="size-4 text-primary" />
                        Convert Video
                    </DialogTitle>
                    <DialogDescription>
                        Paste a YouTube link or upload a video and Gemini will draft your recipe.
                    </DialogDescription>
                </DialogHeader>

                {isBusy ? (
                    <div className="space-y-3">
                        {selectedFile ? (
                            <div className="rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-900">
                                Upload progress: {uploadProgress}%
                            </div>
                        ) : null}
                        <RecipeAiLoadingState messages={AI_COOKING_LOADING_MESSAGES} />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="video-converter-url">YouTube link</Label>
                            <Input
                                id="video-converter-url"
                                value={youtubeUrl}
                                onChange={(event) => {
                                    setYoutubeUrl(event.target.value);
                                    setError("");
                                }}
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                        </div>

                        <div className="relative py-1 text-center text-xs text-muted-foreground">
                            <span className="bg-popover px-2">OR</span>
                            <div className="absolute inset-x-0 top-1/2 -z-10 h-px -translate-y-1/2 bg-border" />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="video-converter-file">Upload video file</Label>
                            <Input
                                ref={fileInputRef}
                                id="video-converter-file"
                                type="file"
                                accept={SUPPORTED_CONVERSION_VIDEO_MIME_TYPES.join(",")}
                                onChange={handlePickFile}
                            />
                            {selectedFile ? (
                                <p className="text-xs text-muted-foreground">
                                    Selected: {selectedFile.name}
                                </p>
                            ) : null}
                        </div>

                        {error ? (
                            <Card className="border-destructive/30 bg-destructive/5 py-0">
                                <CardHeader className="border-b border-destructive/20 pb-2">
                                    <CardTitle className="text-sm text-destructive">Conversion Error</CardTitle>
                                </CardHeader>
                                <CardContent className="max-h-48 overflow-y-auto py-3">
                                    <p className="text-xs whitespace-pre-wrap break-words text-destructive">
                                        {error}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : null}
                        {!error && validationError ? (
                            <p className="text-xs text-muted-foreground">{validationError}</p>
                        ) : null}
                    </div>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isBusy}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConvert}
                        disabled={Boolean(validationError) || isBusy}
                        className="gap-2"
                    >
                        <IconSparkles className="size-4" />
                        {isBusy ? "Cooking..." : "Convert with AI"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
