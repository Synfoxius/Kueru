import { Label } from "@/components/ui/label";

const SORT_FIELDS = [
    { value: "createdAt", label: "Time Created" },
    { value: "upvotes", label: "Upvotes" },
    { value: "time", label: "Cook Time" },
    { value: "servings", label: "Serving Size" },
];

export default function SortControls({ sortField, sortDirection, onSortFieldChange, onSortDirectionChange }) {
    return (
        <div className="grid gap-3 rounded-md border border-border bg-white p-4 sm:grid-cols-2">
            <div className="space-y-1">
                <Label htmlFor="sort-field">Sort By</Label>
                <select
                    id="sort-field"
                    value={sortField}
                    onChange={(event) => onSortFieldChange(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    {SORT_FIELDS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
            <div className="space-y-1">
                <Label htmlFor="sort-direction">Direction</Label>
                <select
                    id="sort-direction"
                    value={sortDirection}
                    onChange={(event) => onSortDirectionChange(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                </select>
            </div>
        </div>
    );
}
