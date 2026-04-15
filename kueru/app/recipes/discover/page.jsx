"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconSearch } from "@tabler/icons-react";
import { getCertifiedChefs, getPopularUsers } from "@/lib/db/userService";
import { getTopChefRecipes, getTopUserRecipes } from "@/lib/db/recipeService";
import DiscoverSectionHeader from "./_components/DiscoverSectionHeader";
import HorizontalScroller from "./_components/HorizontalScroller";
import DiscoverUserCard from "./_components/DiscoverUserCard";
import DiscoverRecipeCard from "./_components/DiscoverRecipeCard";

const SECTION_SIZE = 5;

export default function Page() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [certifiedChefs, setCertifiedChefs] = useState([]);
    const [popularUsers, setPopularUsers] = useState([]);
    const [topChefRecipes, setTopChefRecipes] = useState([]);
    const [topUserRecipes, setTopUserRecipes] = useState([]);

    useEffect(() => {
        let isMounted = true;

        const loadDiscoverData = async () => {
            setLoading(true);
            setError("");

            try {
                const [chefUsersResponse, popularUsersResponse, chefRecipesResponse, userRecipesResponse] = await Promise.all([
                    getCertifiedChefs(null, SECTION_SIZE),
                    getPopularUsers(null, SECTION_SIZE),
                    getTopChefRecipes(SECTION_SIZE),
                    getTopUserRecipes(SECTION_SIZE),
                ]);

                if (!isMounted) {
                    return;
                }

                setCertifiedChefs(chefUsersResponse.users || []);
                setPopularUsers(popularUsersResponse.users || []);
                setTopChefRecipes(chefRecipesResponse || []);
                setTopUserRecipes(userRecipesResponse || []);
            } catch (fetchError) {
                if (!isMounted) {
                    return;
                }
                setError(fetchError?.message || "Unable to load discovery data right now.");
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadDiscoverData();

        return () => {
            isMounted = false;
        };
    }, []);

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

    const renderSectionContent = (items, renderItem, emptyMessage) => {
        if (sectionState.loading) {
            return <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>;
        }

        if (sectionState.error) {
            return <p className="py-6 text-center text-sm text-destructive">{sectionState.error}</p>;
        }

        if (items.length === 0) {
            return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
        }

        return <HorizontalScroller>{items.map(renderItem)}</HorizontalScroller>;
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
                            <Button>Discover</Button>
                            <Button asChild variant="outline">
                                <Link href="/recipes/recommendations">For You</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="border-border bg-white">
                        <CardContent className="px-5 pb-2 pt-2">
                            <DiscoverSectionHeader title="Certified Chefs" href="/recipes/users?type=chefs" />
                            {renderSectionContent(
                                certifiedChefs,
                                (user) => <DiscoverUserCard key={user.id} user={user} />,
                                "No certified chefs found."
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-white">
                        <CardContent className="px-5 pb-2 pt-2">
                            <DiscoverSectionHeader title="Popular Users" href="/recipes/users?type=popular" />
                            {renderSectionContent(
                                popularUsers,
                                (user) => <DiscoverUserCard key={user.id} user={user} />,
                                "No users found."
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="border-border bg-white">
                        <CardContent className="px-5 pb-5 pt-2">
                            <DiscoverSectionHeader
                                title="Top Professional Recipes"
                                href="/recipes/find?verification=verified_only&sortField=upvotes&sortDirection=desc"
                            />
                            {renderSectionContent(
                                topChefRecipes,
                                (recipe) => <DiscoverRecipeCard key={recipe.id} recipe={recipe} />,
                                "No professional recipes available."
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-white">
                        <CardContent className="px-5 pb-5 pt-2">
                            <DiscoverSectionHeader
                                title="Top User Recipes"
                                href="/recipes/find?verification=verified_excluded&sortField=upvotes&sortDirection=desc"
                            />
                            {renderSectionContent(
                                topUserRecipes,
                                (recipe) => <DiscoverRecipeCard key={recipe.id} recipe={recipe} />,
                                "No user recipes available."
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}