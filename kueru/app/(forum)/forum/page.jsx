"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRecentPosts } from "@/lib/db/forumService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { IconSearch, IconPlus } from "@tabler/icons-react";
import Navbar from "@/components/Navbar";

import RecipeOfTheDay from "./_components/RecipeOfTheDay";
import PostCard from "./_components/PostCard";
import TrendingPanel from "./_components/TrendingPanel";
import CategoriesPanel from "./_components/CategoriesPanel";
import DevSeedButton from "./_components/DevSeedButton";

// ── Placeholder data (replace with Firestore fetches later) ──────────────────
const RECIPE_OF_THE_DAY = {
    name: "Mediterranean Quinoa Bowl",
    description: "A vibrant nutrition bowl packed with roasted vegetables, crispy chickpeas, and a creamy tahini dressing.",
    username: "healthychef",
    images: [],
    tags: ["Healthy", "Vegan", "Mediterranean"],
};


const SORT_OPTIONS = ["Most Popular", "Newest", "Most Comments"];

// ─────────────────────────────────────────────────────────────────────────────

export default function ForumPage() {
    const [allPosts, setAllPosts] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("Most Popular");
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);

    const LIMIT = 15;

    useEffect(() => {
        getRecentPosts()
            .then(({ posts, lastDoc }) => {
                setAllPosts(posts);
                setLastDoc(lastDoc);
                setHasMore(posts.length === LIMIT);
                setCategories([...new Set(posts.map(post => post.postCategory).filter(Boolean))]);
            })
            .catch(() => setError("Failed to load forum posts. Please try again later."))
            .finally(() => setLoading(false));
    }, []);

    const handlePostDeleted = (postId) => {
        setAllPosts((prev) => prev.filter((post) => post.id !== postId));
    };

    const handleLoadMore = async () => {
        if (!lastDoc || loadingMore) return;
        setLoadingMore(true);
        try {
            const { posts, lastDoc: newLastDoc } = await getRecentPosts(lastDoc);
            setAllPosts((prev) => [...prev, ...posts]);
            setLastDoc(newLastDoc);
            setHasMore(posts.length === LIMIT);
            setCategories((prev) => [...new Set([...prev, ...posts.map(p => p.postCategory).filter(Boolean)])]);
        } finally {
            setLoadingMore(false);
        }
    };

    const trendingPosts = 
        [...allPosts]
        .sort((a, b) => (b.upvotesCount ?? 0) - (a.upvotesCount ?? 0))
        .slice(0, 5);

    const displayedPosts = [...allPosts]
        .filter(post => {
            const query = search.toLowerCase();
            const matchesSearch = post.title.toLowerCase().includes(query) ||
                post.content?.toLowerCase().includes(query);
            const matchesCategory = selectedCategories.length === 0 ||
                selectedCategories.includes(post.postCategory);
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            if (sort === "Most Popular") {
                return b.upvotesCount - a.upvotesCount;
            }
            if (sort === "Newest") {
                return b.postedDateTime?.seconds - a.postedDateTime?.seconds;
            }
            if (sort === "Most Comments") {
                return b.commentsCount - a.commentsCount;
            }
            return 0;
        });

    return (
        <div className="min-h-screen bg-background">

            <div className="h-14 w-full border-b bg-card flex items-center px-6 text-sm text-muted-foreground">
                <Navbar />
            </div>

            {/* ── Main layout ── */}
            <div className="mx-auto max-w-6xl px-4 py-6 flex gap-6 mb-10">

                {/* ── Left: main content ── */}
                <div className="flex flex-1 flex-col gap-4 min-w-0">

                    <RecipeOfTheDay />

                    {/* Search + sort bar */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search discussions..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-white"
                            />
                        </div>
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring bg-white"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>

                    <Separator />

                    {/* Post feed */}

                    {displayedPosts.length === 0 && !loading && !error && (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                            <div className="flex items-center justify-center size-16 rounded-full bg-muted">
                                <IconSearch className="size-7 text-muted-foreground" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">No posts found</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {search || categories.length > 0
                                        ? "Try adjusting your search or filters"
                                        : "Be the first to start a discussion"}
                                </p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Loading posts...</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {displayedPosts.map((post) => (
                                <PostCard key={post.id} post={post} onDeleted={handlePostDeleted} />
                            ))}
                            {hasMore && !search && selectedCategories.length === 0 && (
                                <Button
                                    variant="outline"
                                    className="w-full bg-white"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? "Loading..." : "Load more"}
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Right: sidebar ── */}
                <aside className="w-64 shrink-0 flex flex-col gap-4">

                    
                    
                    <Link href="/forum/create">
                        <Button className="w-full gap-2">
                            <IconPlus className="size-4" />
                            Create new Post
                        </Button>
                    </Link>
                    <DevSeedButton />
                    <TrendingPanel posts={trendingPosts} />
                    <CategoriesPanel
                        categories={categories}
                        selectedCategories={selectedCategories}
                        onToggle={(category) => {
                            setSelectedCategories((prev) => {
                                const isSelected = prev.includes(category);
                                if (isSelected) {
                                    return prev.filter((c) => c !== category);
                                }
                                return [...prev, category];
                            });
                        }}
                    />
                </aside>

            </div>
        </div>
    );
}