export const INGREDIENT_UNITS = [
    "milligram",
    "gram",
    "kilogram",
    "ounce",
    "pound",
    "teaspoon",
    "tablespoon",
    "fluid ounce",
    "cup",
    "pint",
    "quart",
    "gallon",
    "millilitre",
    "litre",
    "count",
];

export const DEFAULT_INGREDIENT = {
    name: "",
    amount: "",
    unit: "count",
};

export const DEFAULT_STEP = {
    instruction: "",
    ingredientNames: [],
};

export const MAX_MEDIA_FILES = 8;
export const MAX_MEDIA_SIZE_BYTES = 100 * 1024 * 1024;

export const MIN_COOK_TIME = 1;
export const MIN_SERVINGS = 1;

export const FOOD_TYPE_OPTIONS = [
    "Vegan", "Vegetarian", "Keto", "Paleo",
    "Gluten-free", "Dairy-free", "Halal", "Kosher",
    "Low-carb", "Pescatarian",
];

export const ALLERGEN_OPTIONS = [
    "Peanuts", "Tree Nuts", "Milk", "Eggs",
    "Wheat", "Soy", "Fish", "Shellfish", "Sesame",
];

export const CUISINE_TYPE_OPTIONS = [
    "Italian", "Mexican", "Japanese", "Chinese", "Indian", "Thai",
    "French", "Mediterranean", "Korean", "Vietnamese", "American",
    "Middle Eastern", "Spanish", "Greek", "Vegetarian", "Vegan",
    "Desserts", "Baking", "BBQ & Grilling", "Seafood",
];
