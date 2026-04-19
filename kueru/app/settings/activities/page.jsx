"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconThumbUp } from "@tabler/icons-react";

import { useAuth } from "@/context/AuthContext";
import { getUser, getSavedRecipes, unhidePost } from "@/lib/db/userService";
import { getPostsByIds } from "@/lib/db/forumService";
import { getUpvotedPostIds } from "@/lib/db/voteService";
import { getUpvotedRecipes } from "@/lib/db/recipeService";
import { setRecipeVote } from "@/app/recipes/[id]/_utils/recipeInteractionsClient";

import ConditionalNavbar from "@/components/ConditionalNavbar";
import PostCard from "@/app/(forum)/forum/_components/PostCard";
import RecipeCard from "@/components/RecipeCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const TABS = [
    { key: "savedPosts",      label: "Saved Posts" },
    { key: "savedRecipes",    label: "Saved Recipes" },
    { key: "upvotedPosts",    label: "Upvoted Posts" },
    { key: "upvotedRecipes",  label: "Upvoted Recipes" },
    { key: "hiddenPosts",     label: "Hidden Posts" },
];

function TabEmpty({ message }) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{message}</p>;
}

function TabLoading() {
    return <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>;
}

export default function ActivitiesPage() {
    const router = useRouter();
    const { user, userDoc, loading: authLoading } = useAuth();

    const [activeTab, setActiveTab] = useState("savedPosts");
    const [fetched, setFetched]     = useState({});
    const [tabLoading, setTabLoading] = useState({});

    const [savedPosts,     setSavedPosts]     = useState([]);
    const [savedRecipes,   setSavedRecipes]   = useState([]);
    const [upvotedPosts,   setUpvotedPosts]   = useState([]);
    const [upvotedRecipes, setUpvotedRecipes] = useState([]);
    const [hiddenPosts,    setHiddenPosts]    = useState([]);

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [authLoading, user, router]);

    // Lazy-load each tab on first activation
    useEffect(() => {
        if (!user || !userDoc || fetched[activeTab]) return;

        setFetched(prev => ({ ...prev, [activeTab]: true }));
        setTabLoading(prev => ({ ...prev, [activeTab]: true }));

        const load = async () => {
            try {
                switch (activeTab) {
                    case "savedPosts": {
                        const ids = userDoc.savedPosts ?? [];
                        setSavedPosts(ids.length ? await getPostsByIds(ids) : []);
                        break;
                    }
                    case "savedRecipes": {
                        const { recipes } = await getSavedRecipes(user.uid);
                        setSavedRecipes(recipes);
                        break;
                    }
                    case "upvotedPosts": {
                        const ids = await getUpvotedPostIds(user.uid);
                        setUpvotedPosts(ids.length ? await getPostsByIds(ids) : []);
                        break;
                    }
                    case "upvotedRecipes": {
                        setUpvotedRecipes(await getUpvotedRecipes(user.uid));
                        break;
                    }
                    case "hiddenPosts": {
                        const ids = userDoc.hiddenPosts ?? [];
                        setHiddenPosts(ids.length ? await getPostsByIds(ids) : []);
                        break;
                    }
                }
            } catch (err) {
                console.error(`[Activities] Failed to load tab "${activeTab}":`, err);
            } finally {
                setTabLoading(prev => ({ ...prev, [activeTab]: false }));
            }
        };

        load();
    }, [activeTab, user, userDoc, fetched]);

    const handleRemoveRecipeUpvote = async (recipeId) => {
        await setRecipeVote(user.uid, recipeId, 1); // calling with current vote value toggles it off
        setUpvotedRecipes(prev => prev.filter(r => r.id !== recipeId));
    };

    if (authLoading || !user) {
        return (
            <>
                <ConditionalNavbar />
                <div className="flex h-[60vh] items-center justify-center text-muted-foreground text-sm">
                    Loading...
                </div>
            </>
        );
    }

    return (
        <>
            <title>Activity | Kueru</title>
            <ConditionalNavbar />
            <main className="mx-auto w-full max-w-2xl px-4 py-10">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">Activity</h1>
                        <p className="text-sm text-muted-foreground mt-1">Your saved, upvoted and hidden content</p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <IconArrowLeft className="size-4" /> Back
                    </button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full mb-6">
                        {TABS.map(({ key, label }) => (
                            <TabsTrigger key={key} value={key} className="flex-1 text-xs">
                                {label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* Saved Posts */}
                    <TabsContent value="savedPosts">
                        {tabLoading.savedPosts ? <TabLoading /> : savedPosts.length === 0 ? (
                            <TabEmpty message="No saved posts yet." />
                        ) : (
                            <div className="flex flex-col gap-3">
                                {savedPosts.map(post => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        isHidden={false}
                                        onUnsaved={(postId) => setSavedPosts(prev => prev.filter(p => p.id !== postId))}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Saved Recipes */}
                    <TabsContent value="savedRecipes">
                        {tabLoading.savedRecipes ? <TabLoading /> : savedRecipes.length === 0 ? (
                            <TabEmpty message="No saved recipes yet." />
                        ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {savedRecipes.map(r => <RecipeCard key={r.id} recipe={r} />)}
                            </div>
                        )}
                    </TabsContent>

                    {/* Upvoted Posts */}
                    <TabsContent value="upvotedPosts">
                        {tabLoading.upvotedPosts ? <TabLoading /> : upvotedPosts.length === 0 ? (
                            <TabEmpty message="No upvoted posts yet." />
                        ) : (
                            <div className="flex flex-col gap-3">
                                {upvotedPosts.map(post => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        isHidden={false}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Upvoted Recipes */}
                    <TabsContent value="upvotedRecipes">
                        {tabLoading.upvotedRecipes ? <TabLoading /> : upvotedRecipes.length === 0 ? (
                            <TabEmpty message="No upvoted recipes yet." />
                        ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {upvotedRecipes.map(r => (
                                    <div key={r.id} className="relative group">
                                        <RecipeCard recipe={r} />
                                        <button
                                            onClick={() => handleRemoveRecipeUpvote(r.id)}
                                            className="absolute top-2 right-2 z-10 flex items-center justify-center size-7 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                                            title="Remove upvote"
                                        >
                                            <IconThumbUp className="size-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Hidden Posts */}
                    <TabsContent value="hiddenPosts">
                        {tabLoading.hiddenPosts ? <TabLoading /> : hiddenPosts.length === 0 ? (
                            <TabEmpty message="No hidden posts." />
                        ) : (
                            <div className="flex flex-col gap-3">
                                {hiddenPosts.map(post => (
                                    <div key={post.id} className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
                                            <span>This post is hidden</span>
                                            <button
                                                className="text-primary hover:underline font-medium"
                                                onClick={async () => {
                                                    await unhidePost(user.uid, post.id);
                                                    setHiddenPosts(prev => prev.filter(p => p.id !== post.id));
                                                }}
                                            >
                                                Unhide
                                            </button>
                                        </div>
                                        <PostCard post={post} isHidden={false} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </main>
        </>
    );
}
