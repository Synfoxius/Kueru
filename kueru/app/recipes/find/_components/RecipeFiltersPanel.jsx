import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import CookingTimeRangeControl from "./CookingTimeRangeControl";
import OnboardingPreferenceFilters from "./OnboardingPreferenceFilters";

const VERIFICATION_OPTIONS = [
    { value: "include_all", label: "Verified chefs included" },
    { value: "verified_only", label: "Verified chefs only" },
    { value: "verified_excluded", label: "Verified chefs excluded" },
];

const toggleArrayItem = (items, item) => {
    if (items.includes(item)) {
        return items.filter((existingItem) => existingItem !== item);
    }
    return [...items, item];
};

export default function RecipeFiltersPanel({
    filters,
    availableTags,
    availableIngredients,
    maxCookTime,
    showOnboardingFilters,
    onboardingDietaryOptions,
    onboardingAllergyOptions,
    onboardingInterestOptions,
    onFiltersChange,
    onReset,
    onApply,
}) {
    return (
        <Card className="border-border bg-white">
            <CardContent className="space-y-5 p-5">
                <div className="space-y-1">
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">Filter Recipes</h1>
                </div>

                <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="space-y-2 rounded-md border border-border p-3">
                        {availableTags.length === 0 ? <p className="text-xs text-muted-foreground">No tags available.</p> : null}
                        {availableTags.map((tag) => (
                            <div key={tag} className="flex items-center gap-2">
                                <Checkbox
                                    id={`tag-${tag}`}
                                    checked={filters.tags.includes(tag)}
                                    onCheckedChange={() =>
                                        onFiltersChange((previous) => ({
                                            ...previous,
                                            tags: toggleArrayItem(previous.tags, tag),
                                        }))
                                    }
                                />
                                <Label htmlFor={`tag-${tag}`} className="text-sm font-normal">
                                    {tag}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Ingredients</Label>
                    <div className="space-y-2 rounded-md border border-border p-3">
                        {availableIngredients.length === 0 ? <p className="text-xs text-muted-foreground">No ingredients available.</p> : null}
                        {availableIngredients.map((ingredient) => (
                            <div key={ingredient} className="flex items-center gap-2">
                                <Checkbox
                                    id={`ingredient-${ingredient}`}
                                    checked={filters.ingredients.includes(ingredient)}
                                    onCheckedChange={() =>
                                        onFiltersChange((previous) => ({
                                            ...previous,
                                            ingredients: toggleArrayItem(previous.ingredients, ingredient),
                                        }))
                                    }
                                />
                                <Label htmlFor={`ingredient-${ingredient}`} className="text-sm font-normal">
                                    {ingredient}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                <CookingTimeRangeControl
                    value={filters.timeRange}
                    min={0}
                    max={maxCookTime || 240}
                    onChange={(nextRange) => onFiltersChange((previous) => ({ ...previous, timeRange: nextRange }))}
                />

                <div className="space-y-2">
                    <Label>Serving Size</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            type="number"
                            min={0}
                            value={filters.minServings}
                            onChange={(event) =>
                                onFiltersChange((previous) => ({
                                    ...previous,
                                    minServings: event.target.value,
                                }))
                            }
                            placeholder="Min"
                        />
                        <Input
                            type="number"
                            min={0}
                            value={filters.maxServings}
                            onChange={(event) =>
                                onFiltersChange((previous) => ({
                                    ...previous,
                                    maxServings: event.target.value,
                                }))
                            }
                            placeholder="Max"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Chef Verification</Label>
                    <div className="space-y-2 rounded-md border border-border p-3">
                        {VERIFICATION_OPTIONS.map((option) => (
                            <div key={option.value} className="flex items-center gap-2">
                                <Checkbox
                                    id={`verification-${option.value}`}
                                    checked={filters.verification === option.value}
                                    onCheckedChange={(checked) =>
                                        onFiltersChange((previous) => ({
                                            ...previous,
                                            verification: checked ? option.value : "include_all",
                                        }))
                                    }
                                />
                                <Label htmlFor={`verification-${option.value}`} className="text-sm font-normal">
                                    {option.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                <OnboardingPreferenceFilters
                    show={showOnboardingFilters}
                    dietaryOptions={onboardingDietaryOptions}
                    allergyOptions={onboardingAllergyOptions}
                    interestOptions={onboardingInterestOptions}
                    selectedDietary={filters.onboardingDietaryPreferences}
                    selectedExcludedAllergies={filters.onboardingExcludedAllergies}
                    selectedInterests={filters.onboardingRecipeInterests}
                    onDietaryChange={(nextDietary) =>
                        onFiltersChange((previous) => ({
                            ...previous,
                            onboardingDietaryPreferences: nextDietary,
                        }))
                    }
                    onExcludedAllergiesChange={(nextExcludedAllergies) =>
                        onFiltersChange((previous) => ({
                            ...previous,
                            onboardingExcludedAllergies: nextExcludedAllergies,
                        }))
                    }
                    onInterestsChange={(nextInterests) =>
                        onFiltersChange((previous) => ({
                            ...previous,
                            onboardingRecipeInterests: nextInterests,
                        }))
                    }
                />

                <div className="flex flex-col gap-2">
                    <Button type="button" className="w-full" onClick={onApply}>
                        Apply Filters
                    </Button>
                    <Button type="button" variant="outline" className="w-full" onClick={onReset}>
                        Reset Filters
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
