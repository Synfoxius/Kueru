"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { IconSend, IconPencil, IconPhotoVideo, IconTag, IconBook2 } from "@tabler/icons-react";
import RecipeSelector from "./_components/RecipeSelector";
import ImageUploader from "./_components/ImageUploader";
import SectionCard from "./_components/SectionCard";
import BackToForumButton from "../_components/BackToForumButton";
import { createPost } from "@/lib/db/forumService";
import Navbar from "@/components/Navbar";

const CATEGORIES = [
    "Baking Tips", "Rant", "Question", "Discussion", "Recommendation", "Review", "Showoff",
];

const MAX_TITLE_LENGTH = 300;

export default function CreatePostPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [title, setTitle] = useState("");
    const [bodyText, setBodyText] = useState("");
    const [mediaURLs, setMediaURLs] = useState([]);
    const [videoEmbed, setVideoEmbed] = useState(null);
    const [category, setCategory] = useState(null);
    const [selectedRecipeId, setSelectedRecipeId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [loading, user, router]);

    if (loading || !user) {
        return null;
    }

    const postType = selectedRecipeId ? "Recipe" : "Discussion";
    const filledURLs = mediaURLs.filter(Boolean);
    const contentType = filledURLs.length > 0 ? "Media" : "Text";
    const canSubmit = title.trim() && category && !submitting;

    const handleTitleChange = (e) => {
        if (e.target.value.length <= MAX_TITLE_LENGTH) {
            setTitle(e.target.value);
        }
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        try {
            await createPost({
                userId: user.uid,
                title,
                contentType,
                content: bodyText,
                imageURLs: filledURLs,
                videoEmbed: videoEmbed ?? null,
                postCategory: category,
                postType,
                recipeId: postType === "Recipe" ? selectedRecipeId : null,
                status: "available"
            });
            router.push("/forum");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">

            <Navbar />

            {/* Back button */}
            <div className="mx-auto max-w-3xl px-4 pt-4">
                <BackToForumButton />
            </div>

            {/* Page header */}
            <div className="w-full">
                <div className="mx-auto max-w-3xl px-4 py-4 flex items-center gap-4">
                    <div className="flex-1">
                        <h1 className="text-xl font-bold leading-tight">Create a Post</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">Share your recipe, ask a question, or start a discussion</p>
                    </div>
                    {/* Post type badge */}
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                        postType === "Recipe"
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-muted text-muted-foreground border-border"
                    }`}>
                        {postType}
                    </span>
                </div>
            </div>

            {/* Form */}
            <div className="mx-auto max-w-3xl px-4 py-8 flex flex-col gap-5 mb-10">

                {/* Content card */}
                <SectionCard
                    icon={IconPencil}
                    title="Post Content"
                    subtitle="Give your post a title and share your thoughts"
                    required
                >
                    <div className="flex flex-col gap-4">
                        {/* Title */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="title" className="text-xs text-muted-foreground">Title</Label>
                            <div className="relative">
                                <Input
                                    id="title"
                                    placeholder="Give your post a clear, descriptive title"
                                    value={title}
                                    onChange={handleTitleChange}
                                    className="pr-16 bg-background"
                                />
                                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums ${
                                    title.length > MAX_TITLE_LENGTH * 0.9 ? "text-destructive" : "text-muted-foreground"
                                }`}>
                                    {title.length}/{MAX_TITLE_LENGTH}
                                </span>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs text-muted-foreground">Body <span className="text-muted-foreground/50">(optional)</span></Label>
                            <textarea
                                placeholder="Share your thoughts, tips, or story..."
                                value={bodyText}
                                onChange={(e) => setBodyText(e.target.value)}
                                rows={6}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none leading-relaxed transition-colors"
                            />
                        </div>
                    </div>
                </SectionCard>

                {/* Media card */}
                <SectionCard
                    icon={IconPhotoVideo}
                    title="Media (optional)"
                    subtitle="Upload up to 4 photos and/or attach a YouTube video"
                >
                    <ImageUploader
                        userId={user.uid}
                        imageURLs={mediaURLs}
                        onChange={setMediaURLs}
                        videoEmbed={videoEmbed}
                        onVideoChange={setVideoEmbed}
                    />
                </SectionCard>

                {/* Category card */}
                <SectionCard
                    icon={IconTag}
                    title="Category"
                    subtitle="Choose one tag that best fits your post"
                    required
                >
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategory(cat === category ? null : cat)}
                                className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition-all duration-150 ${
                                    category === cat
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                                        : "bg-background text-muted-foreground border-input hover:border-primary hover:text-primary"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </SectionCard>

                {/* Recipe card */}
                <SectionCard
                    icon={IconBook2}
                    title="Link a Recipe (optional)"
                    subtitle="Attach one of your recipes"
                >
                    <RecipeSelector
                        userId={user.uid}
                        selectedRecipeId={selectedRecipeId}
                        onSelect={setSelectedRecipeId}
                    />
                </SectionCard>

                <Separator />

                {/* Actions */}
                <div className="flex items-center justify-between gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => router.push("/forum")}
                        className="px-8 bg-white"
                    >
                        Cancel
                    </Button>
                    <div className="flex items-center gap-3">
                        {title.trim() && !category && (
                            <p className="text-xs text-muted-foreground">Select a category to post</p>
                        )}
                        <Button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            size="lg"
                            className="gap-2 px-8 shadow-sm"
                        >
                            <IconSend className="size-4" />
                            {submitting ? "Posting..." : "Post"}
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}