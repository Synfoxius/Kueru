import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RecipeIngredientsPanel({ ingredients = [] }) {
    return (
        <Card className="border-border bg-white">
            <CardHeader>
                <CardTitle>Ingredients</CardTitle>
            </CardHeader>
            <CardContent>
                {ingredients.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No ingredients were provided for this recipe.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {ingredients.map((ingredient) => {
                            const quantity = ingredient.unit
                                ? `${ingredient.scaledAmountLabel} ${ingredient.unit}`
                                : ingredient.scaledAmountLabel;

                            return (
                                <span
                                    key={ingredient.name}
                                    className="rounded-full border border-accent bg-accent px-3 py-1 text-xs text-accent-foreground"
                                >
                                    {quantity} {ingredient.name}
                                </span>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
