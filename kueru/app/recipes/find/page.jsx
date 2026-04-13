"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getAllRecipes, getAvailableRecipeIngredients, getAvailableRecipeTags } from "@/lib/db/recipeService";
import RecipeFiltersPanel from "./_components/RecipeFiltersPanel";
import SortControls from "./_components/SortControls";
import ActiveFiltersBar from "./_components/ActiveFiltersBar";
import RecipeResultsList from "./_components/RecipeResultsList";

const PAGE_SIZE = 12;
const DEFAULT_TIME_RANGE = [0, 240];
const DEFAULT_FILTERS = {
    searchTerm: "",
    tags: [],
    ingredients: [],
    timeRange: DEFAULT_TIME_RANGE,
    minServings: "",
    maxServings: "",
    verification: "include_all",
    sortField: "createdAt",
    sortDirection: "desc",
};

const parseDelimitedList = (value) => {
    if (!value) {
        return [];
    }

    return value
        .split(",")
        .map((item) => decodeURIComponent(item.trim()))
        .filter(Boolean);
};

const toNumericOrNull = (value) => {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const parseInitialFilters = (searchParams) => {
    const minTimeParam = toNumericOrNull(searchParams.get("minTime"));
    const maxTimeParam = toNumericOrNull(searchParams.get("maxTime"));

    const minTime = minTimeParam === null ? DEFAULT_TIME_RANGE[0] : minTimeParam;
    const maxTime = maxTimeParam === null ? DEFAULT_TIME_RANGE[1] : maxTimeParam;

    const verification = searchParams.get("verification");
    const sortField = searchParams.get("sortField");
    const sortDirection = searchParams.get("sortDirection");

    return {
        searchTerm: searchParams.get("searchTerm") || "",
        tags: parseDelimitedList(searchParams.get("tags")),
        ingredients: parseDelimitedList(searchParams.get("ingredients")),
        timeRange: [Math.min(minTime, maxTime), Math.max(minTime, maxTime)],
        minServings: searchParams.get("minServings") || "",
        maxServings: searchParams.get("maxServings") || "",
        verification: ["include_all", "verified_only", "verified_excluded"].includes(verification)
            ? verification
            : "include_all",
        sortField: ["createdAt", "upvotes", "time", "servings"].includes(sortField) ? sortField : "createdAt",
        sortDirection: sortDirection === "asc" ? "asc" : "desc",
    };
};

const toDbFilters = (filters) => ({
    searchTerm: filters.searchTerm,
    tags: filters.tags,
    ingredients: filters.ingredients,
    minTime: filters.timeRange[0],
    maxTime: filters.timeRange[1],
    minServings: filters.minServings,
    maxServings: filters.maxServings,
    verification: filters.verification,
    sortField: filters.sortField,
    sortDirection: filters.sortDirection,
});

const toQueryString = (filters) => {
    const params = new URLSearchParams();

    if (filters.searchTerm) params.set("searchTerm", filters.searchTerm);
    if (filters.tags.length > 0) params.set("tags", filters.tags.join(","));
    if (filters.ingredients.length > 0) params.set("ingredients", filters.ingredients.join(","));

    if (filters.timeRange[0] !== DEFAULT_TIME_RANGE[0]) params.set("minTime", String(filters.timeRange[0]));
    if (filters.timeRange[1] !== DEFAULT_TIME_RANGE[1]) params.set("maxTime", String(filters.timeRange[1]));

    if (filters.minServings !== "") params.set("minServings", String(filters.minServings));
    if (filters.maxServings !== "") params.set("maxServings", String(filters.maxServings));

    if (filters.verification !== "include_all") params.set("verification", filters.verification);
    if (filters.sortField !== "createdAt") params.set("sortField", filters.sortField);
    if (filters.sortDirection !== "desc") params.set("sortDirection", filters.sortDirection);

    return params.toString();
};

export default function FindRecipesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialFiltersRef = useRef(null);

    if (!initialFiltersRef.current) {
        initialFiltersRef.current = parseInitialFilters(searchParams);
    }

    const [filters, setFilters] = useState(initialFiltersRef.current);
    const [recipes, setRecipes] = useState([]);
    const [availableTags, setAvailableTags] = useState([]);
    const [availableIngredients, setAvailableIngredients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const requestIdRef = useRef(0);

    const dbFilters = useMemo(() => toDbFilters(filters), [filters]);

    useEffect(() => {
        let isMounted = true;

        const loadFilterMetadata = async () => {
            try {
                const [tags, ingredients] = await Promise.all([
                    getAvailableRecipeTags(),
                    getAvailableRecipeIngredients(),
                ]);

                if (!isMounted) {
                    return;
                }

                setAvailableTags(tags || []);
                setAvailableIngredients(ingredients || []);
            } catch (metadataError) {
                if (isMounted) {
                    setError(metadataError?.message || "Unable to load filter metadata.");
                }
            }
        };

        loadFilterMetadata();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const queryString = toQueryString(filters);
        router.replace(queryString ? `/recipes/find?${queryString}` : "/recipes/find", { scroll: false });

        const requestId = ++requestIdRef.current;

        const loadRecipes = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await getAllRecipes(dbFilters, null, PAGE_SIZE);
                if (requestId !== requestIdRef.current) {
                    return;
                }

                const nextRecipes = response.recipes || [];
                setRecipes(nextRecipes);
                setLastDoc(response.lastDoc || null);
                setHasMore(Boolean(response.lastDoc) && nextRecipes.length === PAGE_SIZE);
            } catch (fetchError) {
                if (requestId === requestIdRef.current) {
                    setError(fetchError?.message || "Unable to load recipes right now.");
                }
            } finally {
                if (requestId === requestIdRef.current) {
                    setLoading(false);
                }
            }
        };

        loadRecipes();
    }, [dbFilters, filters, router]);

    const handleLoadMore = useCallback(async () => {
        if (!lastDoc || loadingMore) {
            return;
        }

        setLoadingMore(true);
        setError("");

        try {
            const response = await getAllRecipes(dbFilters, lastDoc, PAGE_SIZE);
            const nextRecipes = response.recipes || [];

            setRecipes((previousRecipes) => {
                const seen = new Set(previousRecipes.map((recipe) => recipe.id));
                const merged = [...previousRecipes];

                nextRecipes.forEach((recipe) => {
                    if (!seen.has(recipe.id)) {
                        merged.push(recipe);
                    }
                });

                return merged;
            });

            setLastDoc(response.lastDoc || null);
            setHasMore(Boolean(response.lastDoc) && nextRecipes.length === PAGE_SIZE);
        } catch (fetchError) {
            setError(fetchError?.message || "Unable to load more recipes.");
        } finally {
            setLoadingMore(false);
        }
    }, [dbFilters, lastDoc, loadingMore]);

    return (
        <div className="min-h-screen bg-muted/30">
            <Navbar />
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
                    <RecipeFiltersPanel
                        filters={filters}
                        availableTags={availableTags}
                        availableIngredients={availableIngredients}
                        onFiltersChange={setFilters}
                        onReset={() => setFilters({ ...DEFAULT_FILTERS })}
                    />

                    <div className="space-y-4">
                        <SortControls
                            sortField={filters.sortField}
                            sortDirection={filters.sortDirection}
                            onSortFieldChange={(value) => setFilters((previous) => ({ ...previous, sortField: value }))}
                            onSortDirectionChange={(value) => setFilters((previous) => ({ ...previous, sortDirection: value }))}
                        />

                        <ActiveFiltersBar
                            filters={filters}
                            onFiltersChange={setFilters}
                            onReset={() => setFilters({ ...DEFAULT_FILTERS })}
                        />

                        <RecipeResultsList
                            recipes={recipes}
                            loading={loading}
                            loadingMore={loadingMore}
                            error={error}
                            hasMore={hasMore}
                            onLoadMore={handleLoadMore}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
