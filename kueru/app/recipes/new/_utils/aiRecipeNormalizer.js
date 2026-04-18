import { INGREDIENT_UNITS, MIN_COOK_TIME, MIN_SERVINGS } from "../_constants";

const normalizeText = (value) => String(value ?? "").trim();

const capitalizeWords = (value) => {
    return normalizeText(value)
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

const toFiniteNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const formatAmount = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return "";
    }
    return String(parsed);
};

const normalizeUnit = (value) => {
    const normalized = normalizeText(value).toLowerCase();
    const matched = INGREDIENT_UNITS.find((unit) => unit.toLowerCase() === normalized);
    return matched || "count";
};

const normalizeIngredientMap = (ingredients) => {
    if (!ingredients || typeof ingredients !== "object" || Array.isArray(ingredients)) {
        return [];
    }

    return Object.entries(ingredients)
        .map(([name, amountAndUnit]) => {
            const ingredientName = normalizeText(name);
            if (!ingredientName || !Array.isArray(amountAndUnit) || amountAndUnit.length < 2) {
                return null;
            }

            const amount = formatAmount(amountAndUnit[0]);
            if (!amount) {
                return null;
            }

            return {
                name: ingredientName,
                amount,
                unit: normalizeUnit(amountAndUnit[1]),
            };
        })
        .filter(Boolean);
};

const normalizeStepRows = (steps, ingredientRows) => {
    const validIngredientNames = new Set(ingredientRows.map((ingredient) => ingredient.name));

    if (!Array.isArray(steps)) {
        return [];
    }

    return steps
        .map((step) => {
            const instruction = normalizeText(step?.instruction);
            if (!instruction) {
                return null;
            }

            const stepIngredientNames = Object.keys(step?.ingredients || {})
                .map((name) => normalizeText(name))
                .filter((name) => validIngredientNames.has(name));

            return {
                instruction,
                ingredientNames: [...new Set(stepIngredientNames)],
            };
        })
        .filter(Boolean);
};

const normalizeTags = (tags) => {
    if (!Array.isArray(tags)) {
        return [];
    }

    return [...new Set(tags.map((tag) => capitalizeWords(tag)).filter(Boolean))];
};

export const normalizeAiRecipe = (rawRecipe = {}) => {
    const recipeName = normalizeText(rawRecipe?.name);
    const description = normalizeText(rawRecipe?.description);

    const cookTime = Math.max(
        MIN_COOK_TIME,
        Math.round(toFiniteNumber(rawRecipe?.time, MIN_COOK_TIME))
    );

    const servings = Math.max(
        MIN_SERVINGS,
        Math.round(toFiniteNumber(rawRecipe?.servings, MIN_SERVINGS))
    );

    const ingredientRows = normalizeIngredientMap(rawRecipe?.ingredients);
    const stepRows = normalizeStepRows(rawRecipe?.steps, ingredientRows);

    return {
        recipeName,
        description,
        cookTime: String(cookTime),
        servings: String(servings),
        allergens: normalizeTags(rawRecipe?.allergens),
        foodTypes: normalizeTags(rawRecipe?.foodTypes),
        cuisineTypes: normalizeTags(rawRecipe?.cuisineTypes),
        ingredientRows,
        steps: stepRows,
    };
};
