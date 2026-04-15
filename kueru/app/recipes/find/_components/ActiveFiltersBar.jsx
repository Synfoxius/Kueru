import { Button } from "@/components/ui/button";
import { IconX } from "@tabler/icons-react";

const DEFAULT_RANGE = [0, 240];

const FilterChip = ({ label, onRemove }) => (
    <Button type="button" variant="secondary" size="sm" className="h-8 gap-1" onClick={onRemove}>
        <span className="max-w-[180px] truncate">{label}</span>
        <IconX className="size-3.5" />
    </Button>
);

export default function ActiveFiltersBar({ filters, onFiltersChange, onReset }) {
    const chips = [];

    if (filters.searchTerm) {
        chips.push({
            key: "search",
            label: `Search: ${filters.searchTerm}`,
            onRemove: () => onFiltersChange((previous) => ({ ...previous, searchTerm: "" })),
        });
    }

    filters.tags.forEach((tag) => {
        chips.push({
            key: `tag-${tag}`,
            label: `Tag: ${tag}`,
            onRemove: () =>
                onFiltersChange((previous) => ({
                    ...previous,
                    tags: previous.tags.filter((item) => item !== tag),
                })),
        });
    });

    filters.ingredients.forEach((ingredient) => {
        chips.push({
            key: `ingredient-${ingredient}`,
            label: `Ingredient: ${ingredient}`,
            onRemove: () =>
                onFiltersChange((previous) => ({
                    ...previous,
                    ingredients: previous.ingredients.filter((item) => item !== ingredient),
                })),
        });
    });

    if (filters.verification !== "include_all") {
        const verificationLabel =
            filters.verification === "verified_only" ? "Verified Chefs Only" : "Verified Chefs Excluded";
        chips.push({
            key: "verification",
            label: verificationLabel,
            onRemove: () => onFiltersChange((previous) => ({ ...previous, verification: "include_all" })),
        });
    }

    if (filters.timeRange[0] !== DEFAULT_RANGE[0] || filters.timeRange[1] !== DEFAULT_RANGE[1]) {
        chips.push({
            key: "time",
            label: `Time: ${filters.timeRange[0]}-${filters.timeRange[1]} min`,
            onRemove: () => onFiltersChange((previous) => ({ ...previous, timeRange: DEFAULT_RANGE })),
        });
    }

    if (filters.minServings !== "" || filters.maxServings !== "") {
        chips.push({
            key: "servings",
            label: `Servings: ${filters.minServings || 0}-${filters.maxServings || "any"}`,
            onRemove: () => onFiltersChange((previous) => ({ ...previous, minServings: "", maxServings: "" })),
        });
    }

    if (chips.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2 rounded-md border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
                {chips.map((chip) => (
                    <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
                ))}
            </div>
            <Button type="button" variant="link" className="h-auto p-0 text-primary" onClick={onReset}>
                Clear all filters
            </Button>
        </div>
    );
}
