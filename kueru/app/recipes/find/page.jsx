"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconSearch } from "@tabler/icons-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { getAllRecipes, getAvailableRecipeIngredients, getAvailableRecipeTags, getMaxRecipeCookTime } from "@/lib/db/recipeService";
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
    onboardingDietaryPreferences: [],
    onboardingRecipeInterests: [],
    onboardingExcludedAllergies: [],
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

const normalizeStringArray = (items) => {
    if (!Array.isArray(items)) {
        return [];
    }

    return [...new Set(items.map((item) => String(item).trim()).filter(Boolean))];
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
        onboardingDietaryPreferences: parseDelimitedList(searchParams.get("onboardingDietary")),
        onboardingRecipeInterests: parseDelimitedList(searchParams.get("onboardingInterests")),
        onboardingExcludedAllergies: parseDelimitedList(searchParams.get("onboardingExcludedAllergies")),
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
    onboardingDietaryPreferences: filters.onboardingDietaryPreferences,
    onboardingRecipeInterests: filters.onboardingRecipeInterests,
    onboardingExcludedAllergies: filters.onboardingExcludedAllergies,
    minTime: filters.timeRange[0],
    maxTime: filters.timeRange[1],
    minServings: filters.minServings,
    maxServings: filters.maxServings,
    verification: filters.verification,
    sortField: filters.sortField,
    sortDirection: filters.sortDirection,
});

const toQueryString = (filters, maxCookTime = 240) => {
    const params = new URLSearchParams();

    if (filters.searchTerm) params.set("searchTerm", filters.searchTerm);
    if (filters.tags.length > 0) params.set("tags", filters.tags.join(","));
    if (filters.ingredients.length > 0) params.set("ingredients", filters.ingredients.join(","));
    if (filters.onboardingDietaryPreferences.length > 0) {
        params.set("onboardingDietary", filters.onboardingDietaryPreferences.join(","));
    }
    if (filters.onboardingRecipeInterests.length > 0) {
        params.set("onboardingInterests", filters.onboardingRecipeInterests.join(","));
    }
    if (filters.onboardingExcludedAllergies.length > 0) {
        params.set("onboardingExcludedAllergies", filters.onboardingExcludedAllergies.join(","));
    }

    if (filters.timeRange[0] !== 0) params.set("minTime", String(filters.timeRange[0]));
    if (filters.timeRange[1] !== maxCookTime && filters.timeRange[1] !== 240) params.set("maxTime", String(filters.timeRange[1]));

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
    const { user, userDoc } = useAuth();
    const initialFiltersRef = useRef(null);
    const appliedAllergyDefaultsForUserRef = useRef(null);
    const hasMaxTimeParamRef = useRef(toNumericOrNull(searchParams.get("maxTime")) !== null);

    if (!initialFiltersRef.current) {
        initialFiltersRef.current = parseInitialFilters(searchParams);
    }

    const [filters, setFilters] = useState(initialFiltersRef.current);
    const [appliedFilters, setAppliedFilters] = useState(initialFiltersRef.current);
    const [recipes, setRecipes] = useState([]);
    const [availableTags, setAvailableTags] = useState([]);
    const [availableIngredients, setAvailableIngredients] = useState([]);
    const [maxCookTime, setMaxCookTime] = useState(240);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const requestIdRef = useRef(0);

    const onboarding = userDoc?.onboarding;
    const onboardingDietaryOptions = useMemo(
        () => normalizeStringArray(onboarding?.dietaryPreferences),
        [onboarding?.dietaryPreferences]
    );
    const onboardingAllergyOptions = useMemo(
        () => normalizeStringArray(onboarding?.foodAllergies),
        [onboarding?.foodAllergies]
    );
    const onboardingInterestOptions = useMemo(
        () => normalizeStringArray(onboarding?.recipeInterests),
        [onboarding?.recipeInterests]
    );

    const dbFilters = useMemo(() => toDbFilters(appliedFilters), [appliedFilters]);

    useEffect(() => {
        if (!user?.uid) {
            appliedAllergyDefaultsForUserRef.current = null;
            return;
        }

        if (!userDoc) {
            return;
        }

        if (appliedAllergyDefaultsForUserRef.current === user.uid) {
            return;
        }

        const hasExistingAllergySelection = initialFiltersRef.current.onboardingExcludedAllergies.length > 0;
        if (!hasExistingAllergySelection && onboardingAllergyOptions.length > 0) {
            setFilters((previous) => ({
                ...previous,
                onboardingExcludedAllergies: onboardingAllergyOptions,
            }));
        }

        appliedAllergyDefaultsForUserRef.current = user.uid;
    }, [onboardingAllergyOptions, user?.uid, userDoc]);

    useEffect(() => {
        let isMounted = true;

        const loadFilterMetadata = async () => {
            try {
                const [tags, ingredients, fetchedMaxTime] = await Promise.all([
                    getAvailableRecipeTags(),
                    getAvailableRecipeIngredients(),
                    getMaxRecipeCookTime(),
                ]);

                if (!isMounted) {
                    return;
                }

                setAvailableTags(tags || []);
                setAvailableIngredients(ingredients || []);
                setMaxCookTime(fetchedMaxTime);

                if (!hasMaxTimeParamRef.current) {
                    setFilters((prev) => ({
                        ...prev,
                        timeRange: [Math.min(prev.timeRange[0], fetchedMaxTime), fetchedMaxTime],
                    }));
                    setAppliedFilters((prev) => ({
                        ...prev,
                        timeRange: [Math.min(prev.timeRange[0], fetchedMaxTime), fetchedMaxTime],
                    }));
                }
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
        const queryString = toQueryString(appliedFilters, maxCookTime);
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
    }, [dbFilters, appliedFilters, router]);

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
                        maxCookTime={maxCookTime}
                        showOnboardingFilters={Boolean(user)}
                        onboardingDietaryOptions={onboardingDietaryOptions}
                        onboardingAllergyOptions={onboardingAllergyOptions}
                        onboardingInterestOptions={onboardingInterestOptions}
                        onFiltersChange={setFilters}
                        onApply={() => setAppliedFilters(filters)}
                        onReset={() => {
                            const resetState = { ...DEFAULT_FILTERS, timeRange: [0, maxCookTime] };
                            setFilters(resetState);
                            setAppliedFilters(resetState);
                        }}
                    />

                    <div className="space-y-4">
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                setAppliedFilters((previous) => ({
                                    ...previous,
                                    searchTerm: filters.searchTerm,
                                }));
                            }}
                            className="relative"
                        >
                            <Input
                                value={filters.searchTerm}
                                onChange={(event) =>
                                    setFilters((previous) => ({
                                        ...previous,
                                        searchTerm: event.target.value,
                                    }))
                                }
                                placeholder="Search by name or description..."
                                className="w-full bg-white pr-12"
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

                        <SortControls
                            sortField={appliedFilters.sortField}
                            sortDirection={appliedFilters.sortDirection}
                            onSortFieldChange={(value) => {
                                setFilters((previous) => ({ ...previous, sortField: value }));
                                setAppliedFilters((previous) => ({ ...previous, sortField: value }));
                            }}
                            onSortDirectionChange={(value) => {
                                setFilters((previous) => ({ ...previous, sortDirection: value }));
                                setAppliedFilters((previous) => ({ ...previous, sortDirection: value }));
                            }}
                        />

                        <ActiveFiltersBar
                            filters={appliedFilters}
                            maxCookTime={maxCookTime}
                            onFiltersChange={(updater) => {
                                setFilters(updater);
                                setAppliedFilters(updater);
                            }}
                            onReset={() => {
                                const resetState = { ...DEFAULT_FILTERS, timeRange: [0, maxCookTime] };
                                setFilters(resetState);
                                setAppliedFilters(resetState);
                            }}
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
