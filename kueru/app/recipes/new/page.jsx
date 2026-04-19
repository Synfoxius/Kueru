"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { createRecipe, getRecipe, updateRecipe } from "@/lib/db/recipeService";
import { processAchievementsOnRecipePost } from "@/lib/achievements/trackingService";
import { processChallengesOnRecipePost } from "@/lib/achievements/challengeTrackingService";
import { getAllChallenges, getUserChallenges } from "@/lib/db/challengeService";
import {
    ALLERGEN_OPTIONS,
    CUISINE_TYPE_OPTIONS,
    DEFAULT_INGREDIENT,
    DEFAULT_STEP,
    FOOD_TYPE_OPTIONS,
    INGREDIENT_UNITS,
    MIN_COOK_TIME,
    MIN_SERVINGS,
} from "./_constants";
import RecipeBasicsSection from "./_components/RecipeBasicsSection";
import RecipeTagsSection, { normalizeTag, splitCommittedTags } from "./_components/RecipeTagsSection";
import RecipeMediaSection from "./_components/RecipeMediaSection";
import VideoConverterDialog from "./_components/VideoConverterDialog";
import RecipeMetaSection from "./_components/RecipeMetaSection";
import IngredientsSection from "./_components/IngredientsSection";
import StepsSection from "./_components/StepsSection";
import RecipeChallengeSection from "./_components/RecipeChallengeSection";
import { buildRecipePayload } from "./_utils/recipePayload";
import { parseMediaItemsForEdit } from "@/lib/media";

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createInitialIngredient = () => ({
    id: createId(),
    ...DEFAULT_INGREDIENT,
});

const createInitialStep = () => ({
    id: createId(),
    ...DEFAULT_STEP,
});

const appendUniqueTags = (existingTags, incomingTags) => {
    const normalizedIncoming = incomingTags.map(normalizeTag).filter(Boolean);
    const deduped = new Set(existingTags);
    normalizedIncoming.forEach((tag) => deduped.add(tag));
    return [...deduped];
};

const getValidationErrors = ({
    recipeName,
    description,
    mediaItems,
    cookTime,
    servings,
    ingredientRows,
    steps,
}) => {
    const errors = {};

    if (!recipeName.trim()) {
        errors.recipeName = "Recipe name is required.";
    }

    if (!description.trim()) {
        errors.description = "Recipe description is required.";
    }

    if (mediaItems.length < 1) {
        errors.media = "Upload at least one image or video.";
    }

    const numericTime = Number(cookTime);
    if (!Number.isFinite(numericTime) || numericTime < MIN_COOK_TIME) {
        errors.time = "Cook time must be at least 1 minute.";
    }

    const numericServings = Number(servings);
    if (!Number.isFinite(numericServings) || numericServings < MIN_SERVINGS) {
        errors.servings = "Servings must be at least 1.";
    }

    const hasValidIngredient = ingredientRows.some((ingredient) => {
        return ingredient.name.trim() && Number(ingredient.amount) > 0 && ingredient.unit;
    });
    if (!hasValidIngredient) {
        errors.ingredients = "Add at least one valid ingredient with amount and unit.";
    }

    const hasValidStep = steps.some((step) => step.instruction.trim());
    if (!hasValidStep) {
        errors.steps = "Add at least one step instruction.";
    }

    return errors;
};

export default function NewRecipePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode');
    const editRecipeId = searchParams.get('recipeId');
    const { user, userDoc, loading } = useAuth();

    const [recipeName, setRecipeName] = useState("");
    const [description, setDescription] = useState("");
    const [cookTime, setCookTime] = useState("25");
    const [servings, setServings] = useState("1");
    const [mediaItems, setMediaItems] = useState([]);
    const [ingredientRows, setIngredientRows] = useState([createInitialIngredient()]);
    const [steps, setSteps] = useState([createInitialStep()]);
    const [allergens, setAllergens] = useState([]);
    const [foodTypes, setFoodTypes] = useState([]);
    const [cuisineTypes, setCuisineTypes] = useState([]);
    const [allergenInput, setAllergenInput] = useState("");
    const [foodTypeInput, setFoodTypeInput] = useState("");
    const [cuisineTypeInput, setCuisineTypeInput] = useState("");
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [isVideoConverterOpen, setIsVideoConverterOpen] = useState(false);
    const [videoConverterLoading, setVideoConverterLoading] = useState(false);
    const [activeChallenges, setActiveChallenges] = useState([]);
    const [selectedChallengeId, setSelectedChallengeId] = useState("");
    const [challengesLoading, setChallengesLoading] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [loading, user, router]);

    useEffect(() => {
        if (!user) return;
        let isMounted = true;
        const loadChallenges = async () => {
            try {
                const [allChallenges, userChallenges] = await Promise.all([
                    getAllChallenges(),
                    getUserChallenges(user.uid),
                ]);
                const joinedIds = new Set(userChallenges.map((uc) => uc.challengeId ?? uc.id));
                const now = Date.now();
                const active = allChallenges.filter((c) => {
                    if (!joinedIds.has(c.id)) return false;
                    const end = c.endDate?.toDate?.() ?? new Date(c.endDate);
                    const start = c.startDate?.toDate?.() ?? new Date(c.startDate);
                    return now >= start.getTime() && now <= end.getTime();
                });
                if (isMounted) setActiveChallenges(active);
            } catch {
                // Non-critical — silently ignore, section won't render
            } finally {
                if (isMounted) setChallengesLoading(false);
            }
        };
        loadChallenges();
        return () => { isMounted = false; };
    }, [user]);

    useEffect(() => {
        let isMounted = true;

        const checkArchivedStatus = async () => {
            if (mode === 'edit' && editRecipeId) {
                try {
                    const recipeData = await getRecipe(editRecipeId);
                    if (isMounted && recipeData) {
                        if (recipeData.status === 'archived' || recipeData.status === 'deleted') {
                            router.push('/recipes/discover');
                            return;
                        }

                        setRecipeName(recipeData.name || "");
                        setDescription(recipeData.description || "");
                        setCookTime(String(recipeData.time || 25));
                        setServings(String(recipeData.servings || 1));
                        setMediaItems(parseMediaItemsForEdit(recipeData.images || []));

                        const backendTags = recipeData.tags || [];
                        setAllergens(backendTags.filter((t) => ALLERGEN_OPTIONS.includes(t)));
                        setFoodTypes(backendTags.filter((t) => FOOD_TYPE_OPTIONS.includes(t) || (!ALLERGEN_OPTIONS.includes(t) && !CUISINE_TYPE_OPTIONS.includes(t))));
                        setCuisineTypes(backendTags.filter((t) => CUISINE_TYPE_OPTIONS.includes(t)));

                        const parsedIngredients = [];
                        if (recipeData.ingredients) {
                            for (const [name, val] of Object.entries(recipeData.ingredients)) {
                                parsedIngredients.push({
                                    id: createId(),
                                    name,
                                    amount: String(val[0]),
                                    unit: val[1],
                                });
                            }
                        }
                        if (parsedIngredients.length === 0) {
                            parsedIngredients.push(createInitialIngredient());
                        }
                        setIngredientRows(parsedIngredients);

                        const parsedSteps = [];
                        if (Array.isArray(recipeData.steps)) {
                            recipeData.steps.forEach((step) => {
                                parsedSteps.push({
                                    id: createId(),
                                    instruction: step.instruction || "",
                                    ingredientNames: Object.keys(step.ingredients || {}),
                                });
                            });
                        }
                        if (parsedSteps.length === 0) {
                            parsedSteps.push(createInitialStep());
                        }
                        setSteps(parsedSteps);
                    }
                } catch (e) {
                    // Ignore, let other things handle it
                }
            }
        };

        checkArchivedStatus();

        return () => {
            isMounted = false;
        };
    }, [mode, editRecipeId, router]);

    const availableIngredients = useMemo(() => {
        const deduped = new Set();
        ingredientRows.forEach((ingredient) => {
            const normalizedName = ingredient.name.trim();
            if (normalizedName) {
                deduped.add(normalizedName);
            }
        });
        return [...deduped];
    }, [ingredientRows]);

    useEffect(() => {
        setSteps((previous) => previous.map((step) => ({
            ...step,
            ingredientNames: step.ingredientNames.filter((ingredientName) => availableIngredients.includes(ingredientName)),
        })));
    }, [availableIngredients]);

    const combinedRecipeTags = useMemo(() => {
        return [...new Set([...allergens, ...foodTypes, ...cuisineTypes])];
    }, [allergens, foodTypes, cuisineTypes]);

    if (loading || !user) {
        return null;
    }

    const handleAddIngredient = () => {
        setIngredientRows((previous) => [...previous, createInitialIngredient()]);
    };

    const handleRemoveIngredient = (index) => {
        setIngredientRows((previous) => {
            if (previous.length <= 1) {
                return previous;
            }
            return previous.filter((_, ingredientIndex) => ingredientIndex !== index);
        });
    };

    const handleIngredientChange = (index, field, value) => {
        setIngredientRows((previous) => previous.map((ingredient, ingredientIndex) => (
            ingredientIndex === index ? { ...ingredient, [field]: value } : ingredient
        )));
    };

    const handleAddStep = () => {
        setSteps((previous) => [...previous, createInitialStep()]);
    };

    const handleRemoveStep = (index) => {
        setSteps((previous) => {
            if (previous.length <= 1) {
                return previous;
            }
            return previous.filter((_, stepIndex) => stepIndex !== index);
        });
    };

    const handleStepInstructionChange = (index, value) => {
        setSteps((previous) => previous.map((step, stepIndex) => (
            stepIndex === index ? { ...step, instruction: value } : step
        )));
    };

    const handleToggleStepIngredient = (index, ingredientName) => {
        setSteps((previous) => previous.map((step, stepIndex) => {
            if (stepIndex !== index) {
                return step;
            }

            const isSelected = step.ingredientNames.includes(ingredientName);
            const ingredientNames = isSelected
                ? step.ingredientNames.filter((name) => name !== ingredientName)
                : [...step.ingredientNames, ingredientName];

            return { ...step, ingredientNames };
        }));
    };

    const handleTagInputChange = (value, setter, inputSetter) => {
        const { committed, trailing } = splitCommittedTags(value);
        if (committed.length > 0) {
            setter((previous) => appendUniqueTags(previous, committed));
        }
        inputSetter(trailing);
    };

    const handleCommitInputTag = (value, setter, inputSetter) => {
        const normalizedValue = normalizeTag(value);
        if (normalizedValue) {
            setter((previous) => appendUniqueTags(previous, [normalizedValue]));
        }
        inputSetter("");
    };

    const handleRemoveTag = (tag, setter) => {
        setter((previous) => previous.filter((existing) => existing !== tag));
    };

    const handleApplyConvertedRecipe = (convertedRecipe) => {
        if (convertedRecipe.recipeName) {
            setRecipeName(convertedRecipe.recipeName);
        }

        if (convertedRecipe.description) {
            setDescription(convertedRecipe.description);
        }

        setCookTime(convertedRecipe.cookTime);
        setServings(convertedRecipe.servings);

        const nextIngredients = (convertedRecipe.ingredientRows.length > 0
            ? convertedRecipe.ingredientRows
            : [createInitialIngredient()]
        ).map((ingredient) => ({
            id: createId(),
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
        }));

        setIngredientRows(nextIngredients);

        const availableIngredientNames = new Set(nextIngredients.map((ingredient) => ingredient.name.trim()).filter(Boolean));

        const nextSteps = (convertedRecipe.steps.length > 0
            ? convertedRecipe.steps
            : [createInitialStep()]
        ).map((step) => ({
            id: createId(),
            instruction: step.instruction || "",
            ingredientNames: (step.ingredientNames || []).filter((ingredientName) => availableIngredientNames.has(ingredientName)),
        }));

        setSteps(nextSteps);

        const allergenTags = (convertedRecipe.allergens || []).map(normalizeTag).filter(Boolean);
        const foodTypeTags = (convertedRecipe.foodTypes || []).map(normalizeTag).filter(Boolean);
        const cuisineTags = (convertedRecipe.cuisineTypes || []).map(normalizeTag).filter(Boolean);

        setAllergens((previous) => appendUniqueTags(previous, allergenTags));
        setCuisineTypes((previous) => appendUniqueTags(previous, cuisineTags));
        setFoodTypes((previous) => appendUniqueTags(previous, foodTypeTags));

        setErrors((previous) => ({
            ...previous,
            recipeName: undefined,
            description: undefined,
            time: undefined,
            servings: undefined,
            ingredients: undefined,
            steps: undefined,
        }));
    };

    const handleSubmit = async () => {
        const nextErrors = getValidationErrors({
            recipeName,
            description,
            mediaItems,
            cookTime,
            servings,
            ingredientRows,
            steps,
        });

        setErrors(nextErrors);
        setSubmitError("");
        if (Object.keys(nextErrors).length > 0 || submitting) {
            return;
        }

        setSubmitting(true);

        try {
            const payload = buildRecipePayload({
                userId: user.uid,
                recipeName,
                description,
                time: cookTime,
                servings,
                mediaItems,
                recipeTags: combinedRecipeTags,
                ingredientRows,
                steps,
                challengeId: selectedChallengeId || null,
            });

            if (mode === 'edit' && editRecipeId) {
                await updateRecipe(editRecipeId, payload);
                router.push(`/recipes/${editRecipeId}?from=edit`);
            } else {
                const { recipeId } = await createRecipe(payload);
                processAchievementsOnRecipePost(user.uid, recipeId, payload).catch(console.error);
                processChallengesOnRecipePost(user.uid, recipeId, payload, userDoc).catch(console.error);
                router.push("/recipes/find");
            }
        } catch (error) {
            setSubmitError(error?.message ?? "Unable to create recipe. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-muted/30">
            <Navbar />

            <main className="mx-auto max-w-4xl px-4 py-6">
                <Link href="/recipes/find" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    <IconArrowLeft className="size-4" />
                    Back
                </Link>

                <div className="mt-3 space-y-6">
                    <RecipeBasicsSection
                        recipeName={recipeName}
                        description={description}
                        onRecipeNameChange={setRecipeName}
                        onDescriptionChange={setDescription}
                        onOpenVideoConverter={() => setIsVideoConverterOpen(true)}
                        videoConverterLoading={videoConverterLoading}
                        errors={errors}
                    />

                    <RecipeMediaSection
                        userId={user.uid}
                        mediaItems={mediaItems}
                        onMediaItemsChange={setMediaItems}
                        error={errors.media}
                    />

                    <RecipeTagsSection
                        allergens={allergens}
                        foodTypes={foodTypes}
                        cuisineTypes={cuisineTypes}
                        allergenInput={allergenInput}
                        foodTypeInput={foodTypeInput}
                        cuisineTypeInput={cuisineTypeInput}
                        allergenSuggestions={ALLERGEN_OPTIONS}
                        foodTypeSuggestions={FOOD_TYPE_OPTIONS}
                        cuisineTypeSuggestions={CUISINE_TYPE_OPTIONS}
                        onAllergenInputChange={(value) => handleTagInputChange(value, setAllergens, setAllergenInput)}
                        onFoodTypeInputChange={(value) => handleTagInputChange(value, setFoodTypes, setFoodTypeInput)}
                        onCuisineTypeInputChange={(value) => handleTagInputChange(value, setCuisineTypes, setCuisineTypeInput)}
                        onCommitAllergenInput={() => handleCommitInputTag(allergenInput, setAllergens, setAllergenInput)}
                        onCommitFoodTypeInput={() => handleCommitInputTag(foodTypeInput, setFoodTypes, setFoodTypeInput)}
                        onCommitCuisineTypeInput={() => handleCommitInputTag(cuisineTypeInput, setCuisineTypes, setCuisineTypeInput)}
                        onRemoveAllergen={(tag) => handleRemoveTag(tag, setAllergens)}
                        onRemoveFoodType={(tag) => handleRemoveTag(tag, setFoodTypes)}
                        onRemoveCuisineType={(tag) => handleRemoveTag(tag, setCuisineTypes)}
                    />

                    <RecipeChallengeSection
                        challenges={activeChallenges}
                        selectedChallengeId={selectedChallengeId}
                        onSelect={setSelectedChallengeId}
                        loading={challengesLoading}
                    />

                    <RecipeMetaSection
                        cookTime={cookTime}
                        servings={servings}
                        onCookTimeChange={setCookTime}
                        onServingsChange={setServings}
                        errors={errors}
                    />

                    <IngredientsSection
                        ingredients={ingredientRows}
                        unitOptions={INGREDIENT_UNITS}
                        onAddIngredient={handleAddIngredient}
                        onRemoveIngredient={handleRemoveIngredient}
                        onIngredientChange={handleIngredientChange}
                        error={errors.ingredients}
                    />

                    <StepsSection
                        steps={steps}
                        availableIngredients={availableIngredients}
                        onAddStep={handleAddStep}
                        onRemoveStep={handleRemoveStep}
                        onStepInstructionChange={handleStepInstructionChange}
                        onToggleStepIngredient={handleToggleStepIngredient}
                        error={errors.steps}
                    />

                    {submitError ? (
                        <p className="text-sm text-destructive">{submitError}</p>
                    ) : null}

                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="h-10 w-full"
                    >
                        {submitting ? "Saving..." : "Done"}
                    </Button>
                </div>
            </main>

            <VideoConverterDialog
                open={isVideoConverterOpen}
                onOpenChange={setIsVideoConverterOpen}
                userId={user.uid}
                onRecipeConverted={handleApplyConvertedRecipe}
                onConvertingChange={setVideoConverterLoading}
            />
        </div>
    );
}
