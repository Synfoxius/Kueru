/**
 * Shared condition-checking utility.
 * Used by both achievement tracking handlers and challenge tracking service
 * to determine whether a given recipe qualifies under a condition.
 *
 * Condition shapes:
 *   null                                          → always qualifies
 *   { type: "tag_includes", value: "Vegetarian" } → recipe must contain the tag
 *   { type: "tag_includes_any", values: [...] }   → recipe must contain at least one tag
 *   { type: "unique_cuisine_tags" }               → always qualifies (contribution is counted differently)
 */

// Geographic cuisine tags whitelist (mirrors trackingHandlers.js)
export const CUISINE_TAGS = new Set([
    "Italian", "Mexican", "Japanese", "Chinese", "Indian", "Thai",
    "French", "Mediterranean", "Korean", "Vietnamese", "American",
    "Middle Eastern", "Spanish", "Greek", "Desserts", "Baking",
    "BBQ & Grilling", "Seafood",
]);

/**
 * Returns true if a recipe qualifies under the given condition.
 * This is a synchronous, client-side check on the recipe payload.
 *
 * @param {object} recipe - the recipe payload (must have a `tags` array)
 * @param {object|null} condition
 * @returns {boolean}
 */
export function recipeMatchesCondition(recipe, condition) {
    if (!condition) return true;

    const tags = recipe.tags ?? [];

    switch (condition.type) {
        case 'tag_includes':
            return tags.includes(condition.value);

        case 'tag_includes_any':
            return (condition.values ?? []).some((v) => tags.includes(v));

        case 'unique_cuisine_tags':
            // For unique_cuisine_tags, we count whether this specific recipe
            // contributes a cuisine tag we haven't seen yet.
            // The caller is responsible for deciding if the recipe counts;
            // here we just check whether the recipe has ANY cuisine tag.
            return tags.some((t) => CUISINE_TAGS.has(t));

        default:
            return true;
    }
}
