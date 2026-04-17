import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    maxCookTime,
    showOnboardingFilters,
    onboardingDietaryOptions,
    onboardingAllergyOptions,
    onboardingInterestOptions,
    isAuthenticated,
    currentUserId,
    onFiltersChange,
    onReset,
    onApply,
}) {
    const [tagSearch, setTagSearch] = useState("");

    const filteredTags = useMemo(() => {
        if (!tagSearch.trim()) return availableTags;
        return availableTags.filter((tag) => 
            tag.toLowerCase().includes(tagSearch.trim().toLowerCase())
        );
    }, [availableTags, tagSearch]);

    return (
        <Card className="border-border bg-white">
            <CardContent className="space-y-5 p-5">
                <div className="space-y-1">
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">Filter Recipes</h1>
                </div>

                <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-col gap-3 rounded-md border border-border p-3">
                        <Input
                            placeholder="Filter tags..."
                            value={tagSearch}
                            onChange={(e) => setTagSearch(e.target.value)}
                            className="h-8 text-sm"
                        />
                        <div className="flex flex-wrap gap-2 max-h-[120px] scrollbar-thin overflow-y-auto overflow-x-hidden p-1">
                            {filteredTags.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No tags found.</p>
                            ) : null}
                            {filteredTags.map((tag) => {
                                const isSelected = filters.tags.includes(tag);
                                return (
                                    <Button
                                        key={tag}
                                        type="button"
                                        size="sm"
                                        variant={isSelected ? "default" : "outline"}
                                        className="rounded-full"
                                        onClick={() =>
                                            onFiltersChange((previous) => ({
                                                ...previous,
                                                tags: toggleArrayItem(previous.tags, tag),
                                            }))
                                        }
                                    >
                                        <span className="truncate max-w-[200px]">{tag}</span>
                                    </Button>
                                );
                            })}
                        </div>
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

                {isAuthenticated && currentUserId && (
                    <div className="space-y-2">
                        <Label>Following</Label>
                        <div className="space-y-2 rounded-md border border-border p-3">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="filter-followed"
                                    checked={filters.followedByUserId === currentUserId}
                                    onCheckedChange={(checked) =>
                                        onFiltersChange((previous) => ({
                                            ...previous,
                                            followedByUserId: checked ? currentUserId : null,
                                        }))
                                    }
                                />
                                <Label htmlFor="filter-followed" className="text-sm font-normal">
                                    Followed users only
                                </Label>
                            </div>
                        </div>
                    </div>
                )}

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
