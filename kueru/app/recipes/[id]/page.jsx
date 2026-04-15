"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    IconArrowBigUp,
    IconArrowLeft,
    IconBookmark,
    IconShare,
} from "@tabler/icons-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { getRecipe } from "@/lib/db/recipeService";
import RecipeIngredientsPanel from "./_components/RecipeIngredientsPanel";
import RecipeInfoPanel from "./_components/RecipeInfoPanel";
import RecipeMediaCarousel from "./_components/RecipeMediaCarousel";
import RecipeStepsPanel from "./_components/RecipeStepsPanel";
import { useRecipeInteractions } from "./_hooks/useRecipeInteractions";
import { useScaledIngredients } from "./_hooks/useScaledIngredients";
import { useStepNavigator } from "./_hooks/useStepNavigator";

const formatCount = (value) => Number(value || 0).toLocaleString();

export default function RecipeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const recipeId = String(params?.id || "");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [recipe, setRecipe] = useState(null);
    const [desiredServings, setDesiredServings] = useState(1);

    useEffect(() => {
        let isMounted = true;

        const fetchRecipe = async () => {
            if (!recipeId) {
                setError("Recipe not found.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");

            try {
                const recipeDoc = await getRecipe(recipeId);
                if (!isMounted) {
                    return;
                }

                if (!recipeDoc) {
                    setRecipe(null);
                    setError("Recipe not found.");
                    return;
                }

                setRecipe(recipeDoc);
                setDesiredServings(Number(recipeDoc.servings) > 0 ? Number(recipeDoc.servings) : 1);
            } catch (fetchError) {
                if (!isMounted) {
                    return;
                }
                setError(fetchError?.message || "Unable to load recipe right now.");
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchRecipe();

        return () => {
            isMounted = false;
        };
    }, [recipeId]);

    const steps = useMemo(() => (Array.isArray(recipe?.steps) ? recipe.steps : []), [recipe?.steps]);

    const { scaledIngredients, formatAmount, scaleAmount } = useScaledIngredients(
        recipe?.ingredients,
        recipe?.servings,
        desiredServings
    );

    const {
        started,
        activeStepIndex,
        canGoPrevious,
        canGoNext,
        start,
        goPrevious,
        goNext,
    } = useStepNavigator(steps.length);

    const {
        upvotes,
        savedCount,
        hasUpvoted,
        hasSaved,
        isWorking,
        feedback,
        showLoginDialog,
        setShowLoginDialog,
        loginHref,
        onVote,
        onSave,
        onShare,
    } = useRecipeInteractions({
        recipeId,
        initialUpvotes: recipe?.upvotes,
        initialSaved: recipe?.saved,
        shareTitle: recipe?.name || "Recipe",
    });

    const handleBack = useCallback(() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
            return;
        }
        router.push("/recipes/discover");
    }, [router]);

    const onDesiredServingsChange = (event) => {
        const nextValue = Number(event.target.value);
        if (!Number.isFinite(nextValue) || nextValue <= 0) {
            return;
        }

        setDesiredServings(nextValue);
    };

    return (
        <div className="min-h-screen bg-[#e6dfd8]">
            <Navbar />
            <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
                <Button type="button" variant="ghost" className="w-fit" onClick={handleBack}>
                    <IconArrowLeft className="size-4" />
                    Back
                </Button>

                {loading ? (
                    <Card className="border-border bg-white">
                        <CardContent className="p-4 text-sm text-muted-foreground">Loading recipe...</CardContent>
                    </Card>
                ) : error ? (
                    <Card className="border-destructive/30 bg-white">
                        <CardContent className="space-y-3 p-4">
                            <p className="text-sm text-destructive">{error}</p>
                            <Button type="button" variant="outline" onClick={() => router.push("/recipes/discover")}>Go to Discover</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <section className="space-y-1">
                            <h1 className="text-4xl font-semibold tracking-tight text-foreground">{recipe?.name || "Untitled Recipe"}</h1>
                            <p className="text-sm text-muted-foreground">by Chef {recipe?.username || "Unknown"}</p>
                        </section>

                        <RecipeMediaCarousel images={recipe?.images} recipeName={recipe?.name} />

                        <Card className="border-border bg-white">
                            <CardContent className="p-4 text-sm leading-relaxed text-foreground">
                                {recipe?.description || "No description available."}
                            </CardContent>
                        </Card>

                        <RecipeInfoPanel
                            tags={recipe?.tags || []}
                            time={recipe?.time}
                            servings={recipe?.servings}
                            desiredServings={desiredServings}
                            onDesiredServingsChange={onDesiredServingsChange}
                            onStart={start}
                            hasSteps={steps.length > 0}
                            started={started}
                        />

                        <RecipeIngredientsPanel ingredients={scaledIngredients} />

                        <RecipeStepsPanel
                            steps={steps}
                            started={started}
                            activeStepIndex={activeStepIndex}
                            canGoPrevious={canGoPrevious}
                            canGoNext={canGoNext}
                            onPrevious={goPrevious}
                            onNext={goNext}
                            scaleAmount={scaleAmount}
                            formatAmount={formatAmount}
                        />

                        <Card className="border-border bg-white">
                            <CardContent className="flex flex-wrap items-center gap-2 p-4">
                                <Button
                                    type="button"
                                    variant={hasUpvoted ? "default" : "outline"}
                                    onClick={onVote}
                                    disabled={isWorking}
                                >
                                    <IconArrowBigUp className="size-4" />
                                    {formatCount(upvotes)}
                                </Button>

                                <Button
                                    type="button"
                                    variant={hasSaved ? "default" : "outline"}
                                    onClick={onSave}
                                    disabled={isWorking}
                                >
                                    <IconBookmark className="size-4" />
                                    {formatCount(savedCount)}
                                </Button>

                                <Button type="button" onClick={onShare} disabled={isWorking}>
                                    <IconShare className="size-4" />
                                    Share
                                </Button>

                                {feedback ? <p className="text-xs text-muted-foreground">{feedback}</p> : null}
                            </CardContent>
                        </Card>
                    </>
                )}
            </main>

            <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sign in required</DialogTitle>
                        <DialogDescription>
                            You can view recipes while logged out, but voting, saving, and sharing require an account.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button asChild>
                            <Link href={loginHref}>Log in</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/register">Sign up</Link>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
