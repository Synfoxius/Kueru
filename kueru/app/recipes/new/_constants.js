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
export const MAX_CONVERSION_VIDEO_SIZE_BYTES = 100 * 1024 * 1024;
export const SUPPORTED_CONVERSION_VIDEO_MIME_TYPES = [
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/x-msvideo",
    "video/x-matroska",
    "video/mpeg",
];

export const AI_COOKING_LOADING_MESSAGES = [
    "Preheating the smart oven...",
    "Sharpening digital chef knives...",
    "Tasting for salt with silicon precision...",
    "Letting the sauce simmer for perfect steps...",
    "Plating your recipe with AI garnish...",
    "Whisking instructions into a smooth guide...",
    "Checking if every ingredient is pantry-friendly...",
];

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
