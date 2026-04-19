"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getRecentPosts } from "@/lib/db/forumService";
import { getUser } from "@/lib/db/userService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { IconSearch, IconPlus, IconLayoutSidebar } from "@tabler/icons-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Navbar from "@/components/Navbar";

import RecipeOfTheDay from "./_components/RecipeOfTheDay";
import PostCard from "./_components/PostCard";
import TrendingPanel from "./_components/TrendingPanel";
import CategoriesPanel from "./_components/CategoriesPanel";

const SORT_OPTIONS = ["Most Popular", "Newest", "Most Comments"];

// ─────────────────────────────────────────────────────────────────────────────

export default function ForumPage() {
    const { user } = useAuth();
    const [hiddenPostIds, setHiddenPostIds] = useState([]);
    const [allPosts, setAllPosts]= useState([]);
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
        if (user) {
            getUser(user.uid).then((u) => {
                if (u?.hiddenPosts) { setHiddenPostIds(u.hiddenPosts); }
            });
        }
    }, [user]);

    useEffect(() => {
        setLoading(true);
        setLastDoc(null);
        setHasMore(true);
        getRecentPosts(null, LIMIT, sort)
            .then(({ posts, lastDoc, fetchedCount }) => {
                setAllPosts(posts);
                setLastDoc(lastDoc);
                setHasMore(fetchedCount === LIMIT);
                setCategories((prev) => [...new Set([...prev, ...posts.map((p) => p.postCategory).filter(Boolean)])]);
            })
            .catch(() => setError("Failed to load forum posts. Please try again later."))
            .finally(() => setLoading(false));
    }, [sort]);

    const handlePostDeleted = (postId) => {
        setAllPosts((prev) => prev.filter((post) => post.id !== postId));
    };

    const handleLoadMore = async () => {
        if (!lastDoc || loadingMore) return;
        setLoadingMore(true);
        try {
            const { posts, lastDoc: newLastDoc, fetchedCount } = await getRecentPosts(lastDoc, LIMIT, sort);
            setAllPosts((prev) => [...prev, ...posts]);
            setLastDoc(newLastDoc);
            setHasMore(fetchedCount === LIMIT);
            setCategories((prev) => [...new Set([...prev, ...posts.map(p => p.postCategory).filter(Boolean)])]);
        } finally {
            setLoadingMore(false);
        }
    };

    const trendingPosts =
        allPosts
        .filter((post) => !hiddenPostIds.includes(post.id))
        .sort((a, b) => (b.upvotesCount ?? 0) - (a.upvotesCount ?? 0))
        .slice(0, 5);

    const handlePostHidden = (postId) => {
        setHiddenPostIds((prev) => [...prev, postId]);
    };

    const handlePostUnhidden = (postId) => {
        setHiddenPostIds((prev) => prev.filter((id) => id !== postId));
    };

    const displayedPosts = allPosts.filter((post) => {
        const query = search.toLowerCase();
        const matchesSearch = post.title.toLowerCase().includes(query) ||
            post.content?.toLowerCase().includes(query);
        const matchesCategory = selectedCategories.length === 0 ||
            selectedCategories.includes(post.postCategory);
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-background">

            <Navbar />

            {/* ── Main layout ── */}
            <div className="mx-auto max-w-6xl px-4 py-6 flex gap-6 mb-10">

                {/* ── Left: main content ── */}
                <div className="flex flex-1 flex-col gap-4 min-w-0">

                    <RecipeOfTheDay />

                    {/* Search + sort bar */}
                    <div className="flex items-center gap-2">
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
                        {/* Mobile: sidebar trigger */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="shrink-0 lg:hidden bg-white">
                                    <IconLayoutSidebar className="size-4" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-72 flex flex-col gap-4 overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>Forum</SheetTitle>
                                </SheetHeader>
                                <Link href="/forum/create">
                                    <Button className="w-full gap-2">
                                        <IconPlus className="size-4" />
                                        Create new Post
                                    </Button>
                                </Link>
                                <TrendingPanel posts={trendingPosts} />
                                <CategoriesPanel
                                    categories={categories}
                                    selectedCategories={selectedCategories}
                                    onToggle={(category) => {
                                        setSelectedCategories((prev) => {
                                            const isSelected = prev.includes(category);
                                            if (isSelected) { return prev.filter((c) => c !== category); }
                                            return [...prev, category];
                                        });
                                    }}
                                />
                            </SheetContent>
                        </Sheet>
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
                                    {search || selectedCategories.length > 0
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
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    onDeleted={handlePostDeleted}
                                    isHidden={hiddenPostIds.includes(post.id)}
                                    onHidden={handlePostHidden}
                                    onUnhidden={handlePostUnhidden}
                                />
                            ))}
                            {hasMore && (
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

                {/* ── Right: sidebar (desktop only) ── */}
                <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-4">
                    <Link href="/forum/create">
                        <Button className="w-full gap-2">
                            <IconPlus className="size-4" />
                            Create new Post
                        </Button>
                    </Link>
                    <TrendingPanel posts={trendingPosts} />
                    <CategoriesPanel
                        categories={categories}
                        selectedCategories={selectedCategories}
                        onToggle={(category) => {
                            setSelectedCategories((prev) => {
                                const isSelected = prev.includes(category);
                                if (isSelected) { return prev.filter((c) => c !== category); }
                                return [...prev, category];
                            });
                        }}
                    />
                </aside>

            </div>
        </div>
    );
}