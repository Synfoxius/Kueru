import { Label } from "@/components/ui/label";
import { IconX } from "@tabler/icons-react";

const normalizeTag = (value) => String(value ?? "").trim();

function splitCommittedTags(value) {
    const parts = String(value ?? "").split(",");
    if (parts.length <= 1) {
        return { committed: [], trailing: value };
    }

    const trailing = parts.pop() ?? "";
    const committed = parts.map(normalizeTag).filter(Boolean);
    return { committed, trailing };
}

function TagGroup({
    title,
    inputId,
    inputValue,
    tags,
    suggestions,
    onInputChange,
    onCommitInput,
    onRemoveTag,
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={inputId}>{title}</Label>

            <div className="flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-lg border border-input bg-white px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                {tags.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => onRemoveTag(tag)}
                            className="rounded-full hover:bg-primary-foreground/20"
                            aria-label={`Remove ${tag}`}
                        >
                            <IconX className="size-3.5" />
                        </button>
                    </span>
                ))}

                <input
                    id={inputId}
                    value={inputValue}
                    onChange={(event) => onInputChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === ",") {
                            event.preventDefault();
                            onCommitInput();
                            return;
                        }

                        if (event.key === "Backspace" && !inputValue.trim() && tags.length > 0) {
                            event.preventDefault();
                            onRemoveTag(tags[tags.length - 1]);
                        }
                    }}
                    onBlur={onCommitInput}
                    placeholder="Type and separate tags with commas"
                    list={`${inputId}-suggestions`}
                    className="h-7 min-w-36 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
                />
            </div>

            <datalist id={`${inputId}-suggestions`}>
                {suggestions.map((suggestion) => (
                    <option key={suggestion} value={suggestion} />
                ))}
            </datalist>
        </div>
    );
}

export default function RecipeTagsSection({
    allergens,
    foodTypes,
    cuisineTypes,
    allergenInput,
    foodTypeInput,
    cuisineTypeInput,
    allergenSuggestions,
    foodTypeSuggestions,
    cuisineTypeSuggestions,
    onAllergenInputChange,
    onFoodTypeInputChange,
    onCuisineTypeInputChange,
    onCommitAllergenInput,
    onCommitFoodTypeInput,
    onCommitCuisineTypeInput,
    onRemoveAllergen,
    onRemoveFoodType,
    onRemoveCuisineType,
}) {
    return (
        <section className="space-y-4 rounded-lg border border-input bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">Recipe Tags</h3>

            <TagGroup
                title="Allergens"
                inputId="recipe-allergens"
                inputValue={allergenInput}
                tags={allergens}
                suggestions={allergenSuggestions}
                onInputChange={onAllergenInputChange}
                onCommitInput={onCommitAllergenInput}
                onRemoveTag={onRemoveAllergen}
            />

            <TagGroup
                title="Food Type"
                inputId="recipe-food-type"
                inputValue={foodTypeInput}
                tags={foodTypes}
                suggestions={foodTypeSuggestions}
                onInputChange={onFoodTypeInputChange}
                onCommitInput={onCommitFoodTypeInput}
                onRemoveTag={onRemoveFoodType}
            />

            <TagGroup
                title="Cuisine Type"
                inputId="recipe-cuisine-type"
                inputValue={cuisineTypeInput}
                tags={cuisineTypes}
                suggestions={cuisineTypeSuggestions}
                onInputChange={onCuisineTypeInputChange}
                onCommitInput={onCommitCuisineTypeInput}
                onRemoveTag={onRemoveCuisineType}
            />
        </section>
    );
}

export { normalizeTag, splitCommittedTags };
