"use client";

import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { IconFlask } from "@tabler/icons-react";

const SEED_RECIPE = {
    name: "Spaghetti Carbonara",
    time: 30,
    images: [],
    tags: ["Italian", "Pasta", "Quick"],
    servings: 2,
    upvotes: 0,
    saved: 0,
    ingredients: {
        "spaghetti": [200, "g"],
        "pancetta": [100, "g"],
        "eggs": [2, "whole"],
        "parmesan": [50, "g"],
        "black pepper": [1, "tsp"],
        "salt": [1, "tsp"],
    },
    steps: [
        {
            instruction: "Bring a large pot of salted water to a boil and cook spaghetti until al dente.",
            ingredients: {
                "spaghetti": [200, "g"],
                "salt": [1, "tsp"],
            },
        },
        {
            instruction: "Fry pancetta in a pan over medium heat until crispy.",
            ingredients: {
                "pancetta": [100, "g"],
            },
        },
        {
            instruction: "Whisk eggs and parmesan together in a bowl. Season with black pepper.",
            ingredients: {
                "eggs": [2, "whole"],
                "parmesan": [50, "g"],
                "black pepper": [1, "tsp"],
            },
        },
        {
            instruction: "Remove pan from heat. Toss drained pasta with pancetta, then quickly mix in the egg mixture. Serve immediately.",
            ingredients: {},
        },
    ],
    challengeId: null,
};

export default function DevSeedButton() {
    const { user, userDoc } = useAuth();

    const handleSeed = async () => {
        if (!user) { alert("You must be logged in to seed a recipe."); return; }
        try {
            const ref = await addDoc(collection(db, "recipes"), {
                ...SEED_RECIPE,
                userId: user.uid,
                createdAt: serverTimestamp(),
            });
            alert(`Seeded recipe: ${ref.id}`);
        } catch (e) {
            alert(`Seed failed: ${e.message}`);
        }
    };

    return (
        <Button
            variant="outline"
            className="w-full gap-2 border-dashed text-muted-foreground"
            onClick={handleSeed}
        >
            <IconFlask className="size-4" />
            [DEV] Seed Recipe
        </Button>
    );
}
