import { getAI, getGenerativeModel, Schema, VertexAIBackend } from "firebase/ai";
import { app } from "@/lib/firebase/config";

const DEFAULT_MODEL = "gemini-2.5-pro";
const CONVERSION_PROMPT = "Convert this video into a step-by-step recipe guide";
const ALLOWED_UNITS = [
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

const INGREDIENT_ENTRY_SCHEMA = Schema.array({
    items: Schema.string({}),
    minItems: 2,
    maxItems: 2,
});

const STEP_SCHEMA = Schema.object({
    properties: {
        instruction: Schema.string({
            description: "Step instruction",
        }),
        ingredients: Schema.object({
            description: "Ingredient map for this step. Keys must exist in root ingredients.",
            properties: {},
            additionalProperties: INGREDIENT_ENTRY_SCHEMA,
        }),
    },
    optionalProperties: ["ingredients"],
});

const RECIPE_RESPONSE_SCHEMA = Schema.object({
    properties: {
        name: Schema.string({
            description: "Recipe name",
        }),
        description: Schema.string({
            description: "Recipe description",
        }),
        time: Schema.number({
            description: "Time needed for recipe in minutes",
        }),
        allergens: Schema.array({
            description: "Allergen tags (capitalized)",
            items: Schema.string({}),
            maxItems: 20,
        }),
        foodTypes: Schema.array({
            description: "Food type tags (capitalized)",
            items: Schema.string({}),
            maxItems: 20,
        }),
        cuisineTypes: Schema.array({
            description: "Cuisine type tags (capitalized)",
            items: Schema.string({}),
            maxItems: 20,
        }),
        servings: Schema.number({
            description: "Number of servings",
        }),
        ingredients: Schema.object({
            description: "Main ingredient map. Key is ingredient name, value is [amount, unit].",
            properties: {},
            additionalProperties: INGREDIENT_ENTRY_SCHEMA,
        }),
        steps: Schema.array({
            description: "Ordered recipe steps",
            items: STEP_SCHEMA,
        }),
    },
    optionalProperties: ["allergens", "foodTypes", "cuisineTypes"],
});

const buildVideoPart = ({ videoUrl, isYouTubeUrl, videoMimeType }) => {
    const safeMimeType = videoMimeType || "video/mp4";

    if (isYouTubeUrl) {
        return {
            fileData: {
                mimeType: safeMimeType,
                fileUri: videoUrl,
            },
        };
    }

    return {
        fileData: {
            mimeType: safeMimeType,
            fileUri: videoUrl,
        },
    };
};

const parseStructuredResponse = (responseText) => {
    if (!responseText || typeof responseText !== "string") {
        throw new Error("Gemini returned an empty response.");
    }

    try {
        return JSON.parse(responseText);
    } catch {
        const fencedJson = responseText.match(/```json\s*([\s\S]*?)\s*```/i);
        if (fencedJson?.[1]) {
            return JSON.parse(fencedJson[1]);
        }
        throw new Error(`Gemini response was not valid JSON. Raw response: ${responseText}`);
    }
};

export async function convertVideoToRecipe({
    videoUrl,
    isYouTubeUrl,
    videoMimeType,
    modelName = DEFAULT_MODEL,
}) {
    const ai = getAI(app, { backend: new VertexAIBackend() });

    const model = getGenerativeModel(ai, {
        model: modelName,
        generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 40960,
            responseMimeType: "application/json",
            responseSchema: RECIPE_RESPONSE_SCHEMA,
        },
    });

    const instructions = [
        CONVERSION_PROMPT,
        "Return valid JSON following the provided schema exactly.",
        `For ingredient units, only use one of: ${ALLOWED_UNITS.join(", ")}. Use \"count\" as fallback if another unit would be needed.`,
        "Each step ingredient key must be present in the top-level ingredients object.",
        "Ensure all returned tags are capitalized.",
    ].join(" ");

    const requestParts = [
        { text: instructions },
        buildVideoPart({ videoUrl, isYouTubeUrl, videoMimeType }),
    ];

    const result = await model.generateContent(requestParts);
    const response = await result.response;
    return parseStructuredResponse(response.text());
}
