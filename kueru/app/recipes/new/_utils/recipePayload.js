const toNumber = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
};

const normalizeName = (value) => String(value ?? "").trim();

export const getValidIngredients = (ingredientRows = []) => {
    return ingredientRows
        .map((row) => ({
            name: normalizeName(row?.name),
            amount: toNumber(row?.amount),
            unit: normalizeName(row?.unit),
        }))
        .filter((row) => row.name && row.amount !== null && row.amount > 0 && row.unit);
};

export const buildRecipePayload = ({
    userId,
    recipeName,
    description,
    time,
    servings,
    mediaItems,
    recipeTags,
    ingredientRows,
    steps,
}) => {
    const normalizedName = normalizeName(recipeName);
    const normalizedDescription = normalizeName(description);

    const normalizedTime = toNumber(time);
    const normalizedServings = toNumber(servings);

    const validIngredients = getValidIngredients(ingredientRows);
    const ingredientMap = validIngredients.reduce((accumulator, ingredient) => {
        accumulator[ingredient.name] = [ingredient.amount, ingredient.unit];
        return accumulator;
    }, {});

    const normalizedSteps = (steps ?? [])
        .map((step) => {
            const instruction = normalizeName(step?.instruction);
            if (!instruction) {
                return null;
            }

            const selectedIngredientNames = Array.isArray(step?.ingredientNames)
                ? step.ingredientNames
                : [];

            const stepIngredients = selectedIngredientNames.reduce((accumulator, ingredientName) => {
                if (ingredientMap[ingredientName]) {
                    accumulator[ingredientName] = ingredientMap[ingredientName];
                }
                return accumulator;
            }, {});

            return {
                instruction,
                ingredients: stepIngredients,
            };
        })
        .filter(Boolean);

    const mediaUrls = (mediaItems ?? [])
        .map((item) => String(item?.url ?? "").trim())
        .filter(Boolean);

    const normalizedTags = [...new Set((recipeTags ?? [])
        .map((tag) => normalizeName(tag))
        .filter(Boolean))];

    return {
        userId,
        name: normalizedName,
        description: normalizedDescription,
        time: normalizedTime,
        servings: normalizedServings,
        images: mediaUrls,
        tags: normalizedTags,
        ingredients: ingredientMap,
        steps: normalizedSteps,
        challengeId: null,
    };
};
