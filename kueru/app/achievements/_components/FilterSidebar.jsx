"use client";

import { IconSearch } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/**
 * Edit this array to add or remove filter categories.
 * The values must match the `category` field in your Firestore achievements collection.
 */
export const ACHIEVEMENT_CATEGORIES = [
    "Cooking Streaks",
    "Exploration",
    "Skill Badges",
    "Milestones",
];

/**
 * Sticky search + category filter sidebar.
 * All state lives in the parent (page.jsx) — this component only calls callbacks.
 *
 * @param {{
 *   searchQuery: string,
 *   onSearchChange: (value: string) => void,
 *   selectedCategories: Set<string>,
 *   onCategoryChange: (category: string, checked: boolean) => void
 * }} props
 */
export default function FilterSidebar({
    searchQuery,
    onSearchChange,
    selectedCategories,
    onCategoryChange,
}) {
    return (
        <Card className="sticky top-20 w-64 shrink-0 self-start">
            <CardHeader className="pb-0">
                <CardTitle className="text-sm font-semibold">Search and Filter</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Search input */}
                <div className="relative">
                    <IconSearch className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search achievements..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-8 text-sm"
                    />
                </div>

                {/* Category checkboxes */}
                <div className="space-y-2.5">
                    {ACHIEVEMENT_CATEGORIES.map((category) => (
                        <div key={category} className="flex items-center gap-2">
                            <Checkbox
                                id={`filter-${category}`}
                                checked={selectedCategories.has(category)}
                                onCheckedChange={(checked) => onCategoryChange(category, checked)}
                            />
                            <Label
                                htmlFor={`filter-${category}`}
                                className="text-sm font-normal cursor-pointer"
                            >
                                {category}
                            </Label>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}