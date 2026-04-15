import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const toggleArrayItem = (items, item) => {
    if (items.includes(item)) {
        return items.filter((existingItem) => existingItem !== item);
    }

    return [...items, item];
};

function BadgeGroup({ title, options, selectedItems, onToggle }) {
    if (!Array.isArray(options) || options.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            <Label>{title}</Label>
            <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const isSelected = selectedItems.includes(option);

                    return (
                        <Button
                            key={option}
                            type="button"
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            className="rounded-full"
                            onClick={() => onToggle(option)}
                        >
                            {option}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}

export default function OnboardingPreferenceFilters({
    show,
    dietaryOptions,
    allergyOptions,
    interestOptions,
    selectedDietary,
    selectedExcludedAllergies,
    selectedInterests,
    onDietaryChange,
    onExcludedAllergiesChange,
    onInterestsChange,
}) {
    const hasVisibleOptions =
        (Array.isArray(dietaryOptions) && dietaryOptions.length > 0) ||
        (Array.isArray(allergyOptions) && allergyOptions.length > 0) ||
        (Array.isArray(interestOptions) && interestOptions.length > 0);

    if (!show || !hasVisibleOptions) {
        return null;
    }

    return (
        <div className="space-y-3 rounded-md border border-border p-3">
            <div className="space-y-1">
                <h2 className="text-sm font-semibold text-foreground">Preference Filters</h2>
                <p className="text-xs text-muted-foreground">
                    Filters based on your preferences.
                </p>
            </div>

            <BadgeGroup
                title="Dietary Preferences"
                options={dietaryOptions}
                selectedItems={selectedDietary}
                onToggle={(option) => onDietaryChange(toggleArrayItem(selectedDietary, option))}
            />

            <BadgeGroup
                title="Food Allergies"
                options={allergyOptions}
                selectedItems={selectedExcludedAllergies}
                onToggle={(option) => onExcludedAllergiesChange(toggleArrayItem(selectedExcludedAllergies, option))}
            />

            <BadgeGroup
                title="Interests"
                options={interestOptions}
                selectedItems={selectedInterests}
                onToggle={(option) => onInterestsChange(toggleArrayItem(selectedInterests, option))}
            />
        </div>
    );
}
