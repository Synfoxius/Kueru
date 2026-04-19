"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    IconArrowBigDown,
    IconArrowBigUp,
    IconArrowLeft,
    IconBookmark,
    IconShare,
    IconFlag,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { getRecipe, deleteRecipe } from "@/lib/db/recipeService";
import { createReport } from "@/lib/db/reportService";
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
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const recipeId = String(params?.id || "");
    const isFromEditFlow = searchParams.get("from") === "edit";

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [recipe, setRecipe] = useState(null);
    const [desiredServings, setDesiredServings] = useState(1);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    // Report state
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [reportDetails, setReportDetails] = useState("");
    const [isReporting, setIsReporting] = useState(false);
    const [isReportSuccess, setIsReportSuccess] = useState(false);
    const [reportError, setReportError] = useState("");

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
        voteValue,
        hasSaved,
        isWorking,
        feedback,
        showLoginDialog,
        setShowLoginDialog,
        loginHref,
        onUpvote,
        onDownvote,
        onSave,
        onShare,
    } = useRecipeInteractions({
        recipeId,
        initialUpvotes: recipe?.upvotes,
        initialSaved: recipe?.saved,
        shareTitle: recipe?.name || "Recipe",
    });

    const handleBack = useCallback(() => {
        if (isFromEditFlow) {
            router.push(recipe?.username ? `/profile/${recipe.username}` : "/profile");
            return;
        }

        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
            return;
        }
        router.push("/recipes/discover");
    }, [isFromEditFlow, recipe?.username, router]);

    const onDesiredServingsChange = (event) => {
        const nextValue = Number(event.target.value);
        if (!Number.isFinite(nextValue) || nextValue <= 0) {
            return;
        }

        setDesiredServings(nextValue);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteRecipe(recipeId);
            setRecipe(prev => ({ ...prev, status: 'deleted' }));
            setShowDeleteConfirm(false);
        } catch (err) {
            setError("Failed to delete recipe.");
            setShowDeleteConfirm(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleReport = async () => {
        if (!user) {
            setShowLoginDialog(true);
            return;
        }
        if (!reportReason) {
            return;
        }

        setIsReporting(true);
        setReportError("");
        try {
            await createReport(recipeId, 'recipe', user.uid, reportReason, reportDetails);
            setIsReportSuccess(true);
        } catch (err) {
            setReportError("Failed to submit report. Please try again.");
        } finally {
            setIsReporting(false);
        }
    };

    const canEditRecipe = Boolean(
        user?.uid &&
        recipe?.userId &&
        user.uid === recipe.userId &&
        recipe?.status !== "archived" &&
        recipe?.status !== "deleted"
    );

    const canDeleteRecipe = Boolean(
        user?.uid &&
        recipe?.userId &&
        user.uid === recipe.userId &&
        recipe?.status !== "deleted"
    );

    return (
        <div className="min-h-screen bg-muted/30">
            <Navbar />
            <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
                <Button type="button" variant="ghost" className="w-fit text-sm font-medium text-primary hover:bg-transparent hover:text-primary/80" onClick={handleBack}>
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
                ) : recipe?.status === "deleted" ? (
                    <Card className="border-border bg-white mt-10">
                        <CardContent className="space-y-4 p-8 flex flex-col items-center justify-center text-center">
                            <h2 className="text-2xl font-bold">This recipe has been deleted</h2>
                            <p className="text-muted-foreground">The creator has removed this recipe, so it is no longer available.</p>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
                                <Button asChild>
                                    <Link href="/recipes/discover">Discover Page</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <section className="space-y-1">
                            <h1 className="text-4xl font-semibold tracking-tight text-foreground">{recipe?.name || "Untitled Recipe"}</h1>
                            <p className="text-sm text-muted-foreground">by @{recipe?.username || "Unknown"}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {canEditRecipe ? (
                                    <Button asChild variant="outline" className="w-fit">
                                        <Link href={`/recipes/new?mode=edit&recipeId=${recipeId}`}>Edit Recipe</Link>
                                    </Button>
                                ) : null}
                                {canDeleteRecipe ? (
                                    <Button variant="destructive" className="w-fit" onClick={() => setShowDeleteConfirm(true)}>
                                        Delete Recipe
                                    </Button>
                                ) : null}
                            </div>
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
                    </>
                )}

                {!loading && !error && recipe && (
                    <Card className="border-border bg-white">
                        <CardContent className="flex flex-wrap items-center gap-2 p-4">
                            <div className="inline-flex overflow-hidden rounded-lg border border-primary/25">
                                <Button
                                    type="button"
                                    variant={voteValue === 1 ? "default" : "outline"}
                                    onClick={onUpvote}
                                    disabled={isWorking || recipe?.status === "deleted"}
                                    className="rounded-none border-0"
                                >
                                    <IconArrowBigUp className="size-4" />
                                </Button>
                                <span className="inline-flex min-w-16 items-center justify-center bg-primary px-3 text-sm font-medium text-primary-foreground">
                                    {formatCount(upvotes)}
                                </span>
                                <Button
                                    type="button"
                                    variant={voteValue === -1 ? "default" : "outline"}
                                    onClick={onDownvote}
                                    disabled={isWorking || recipe?.status === "deleted"}
                                    className="rounded-none border-0"
                                >
                                    <IconArrowBigDown className="size-4" />
                                </Button>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={onSave}
                                disabled={isWorking}
                                className={hasSaved
                                    ? "border-[#e7be4f] bg-[#f9d976] text-[#6b4a00] hover:bg-[#f2cf64]"
                                    : "border-[#e7be4f] bg-white text-[#9b7000] hover:bg-[#fff4d1]"
                                }
                            >
                                <IconBookmark className="size-4" />
                                {formatCount(savedCount)}
                            </Button>

                            <Button type="button" onClick={onShare} disabled={isWorking || recipe?.status === "deleted"}>
                                <IconShare className="size-4" />
                                Share
                            </Button>

                            <Button 
                                type="button" 
                                variant="outline" 
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive" 
                                onClick={() => user ? setShowReportModal(true) : setShowLoginDialog(true)} 
                                disabled={isWorking || recipe?.status === "deleted"}
                            >
                                <IconFlag className="size-4" />
                                Report
                            </Button>

                            {feedback ? <p className="text-xs text-muted-foreground">{feedback}</p> : null}
                        </CardContent>
                    </Card>
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

            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Recipe</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this recipe? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showReportModal} onOpenChange={(open) => {
                setShowReportModal(open);
                if (!open) {
                    setTimeout(() => {
                        setReportReason("");
                        setReportDetails("");
                        setIsReportSuccess(false);
                        setReportError("");
                    }, 300);
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isReportSuccess ? "Report Submitted" : "Report Recipe"}</DialogTitle>
                        <DialogDescription>
                            {isReportSuccess
                                ? "Thank you for letting us know. Our team will review this recipe shortly."
                                : "Please let us know why you are reporting this recipe."
                            }
                        </DialogDescription>
                    </DialogHeader>
                    {isReportSuccess ? null : (
                        <div className="space-y-4 py-4">
                            {reportError ? (
                                <div className="p-3 text-sm flex items-center gap-2 rounded-md bg-destructive/15 text-destructive">
                                    <IconFlag className="size-4" />
                                    {reportError}
                                </div>
                            ) : null}
                            <div className="space-y-2">
                                <Label htmlFor="reason">Reason</Label>
                                <Select value={reportReason} onValueChange={setReportReason}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a reason" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="spam">Spam or misleading</SelectItem>
                                        <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                                        <SelectItem value="copyright">Copyright violation</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="details">Additional Details (Optional)</Label>
                                <Textarea 
                                    id="details" 
                                    placeholder="Provide more context..." 
                                    value={reportDetails}
                                    onChange={(e) => setReportDetails(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        {isReportSuccess ? (
                            <Button onClick={() => setShowReportModal(false)}>Close</Button>
                        ) : (
                            <>
                                <Button variant="outline" onClick={() => setShowReportModal(false)} disabled={isReporting}>Cancel</Button>
                                <Button variant="destructive" onClick={handleReport} disabled={isReporting || !reportReason}>
                                    {isReporting ? "Submitting..." : "Submit Report"}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
