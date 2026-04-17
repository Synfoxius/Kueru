"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconSearch } from "@tabler/icons-react";
import { getAllRecipes } from "@/lib/db/recipeService";
import { useAuth } from "@/context/AuthContext";
import DiscoverSectionHeader from "../discover/_components/DiscoverSectionHeader";
import HorizontalScroller from "../discover/_components/HorizontalScroller";
import DiscoverRecipeCard from "../discover/_components/DiscoverRecipeCard";

const SECTION_SIZE = 5;

export default function ForYouPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [newestRecipes, setNewestRecipes] = useState([]);
    const [topRecipes, setTopRecipes] = useState([]);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        let isMounted = true;

        const loadForYouData = async () => {
            setLoading(true);
            setError("");

            try {
                const [newestResponse, topResponse] = await Promise.all([
                    getAllRecipes(
                        { followedByUserId: user.uid, sortField: "createdAt", sortDirection: "desc" },
                        null,
                        SECTION_SIZE
                    ),
                    getAllRecipes(
                        { followedByUserId: user.uid, sortField: "upvotes", sortDirection: "desc" },
                        null,
                        SECTION_SIZE
                    ),
                ]);

                if (!isMounted) return;

                setNewestRecipes(newestResponse.recipes || []);
                setTopRecipes(topResponse.recipes || []);
            } catch (fetchError) {
                if (!isMounted) return;
                setError(fetchError?.message || "Unable to load your customized feed right now.");
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadForYouData();

        return () => {
            isMounted = false;
        };
    }, [user]);

    const sectionState = useMemo(
        () => ({
            loading,
            error,
        }),
        [loading, error]
    );

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        const query = searchTerm.trim();
        const target = query
            ? `/recipes/find?searchTerm=${encodeURIComponent(query)}`
            : "/recipes/find";
        router.push(target);
    };

    const renderSectionContent = (items, emptyMessage) => {
        if (sectionState.loading) {
            return <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>;
        }

        if (sectionState.error) {
            return <p className="py-6 text-center text-sm text-destructive">{sectionState.error}</p>;
        }

        if (!user) {
            return (
                <div className="flex flex-col items-center justify-center py-6 gap-4">
                    <p className="text-center text-sm text-muted-foreground">Log in to view recipes from creators you follow.</p>
                </div>
            );
        }

        if (items.length === 0) {
            return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
        }

        return (
            <HorizontalScroller>
                {items.map((recipe) => (
                    <DiscoverRecipeCard key={recipe.id} recipe={recipe} />
                ))}
            </HorizontalScroller>
        );
    };

    return (
        <div className="min-h-screen bg-muted/30">
            <Navbar />
            <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
                <Card className="border-border bg-white">
                    <CardContent className="space-y-4 p-4">
                        <form onSubmit={handleSearchSubmit} className="relative">
                            <Input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search for users or dishes..."
                                className="pr-12"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                variant="ghost"
                                className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2"
                            >
                                <IconSearch className="size-4" />
                            </Button>
                        </form>

                        <div className="flex items-center justify-center gap-2">
                            <Button asChild variant="outline">
                                <Link href="/recipes/discover">Discover</Link>
                            </Button>
                            <Button>For You</Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-1">
                    <Card className="border-border bg-white">
                        <CardContent className="px-5 pb-5 pt-2">
                            <DiscoverSectionHeader
                                title="Newest Recipes from Followed"
                                href={user ? `/recipes/find?followedByUserId=${user.uid}&sortField=createdAt&sortDirection=desc` : "/recipes/find"}
                            />
                            {renderSectionContent(
                                newestRecipes,
                                "No new recipes from followed creators."
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-white">
                        <CardContent className="px-5 pb-5 pt-2">
                            <DiscoverSectionHeader
                                title="Top Recipes from Followed"
                                href={user ? `/recipes/find?followedByUserId=${user.uid}&sortField=upvotes&sortDirection=desc` : "/recipes/find"}
                            />
                            {renderSectionContent(
                                topRecipes,
                                "No top recipes from followed creators available."
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
