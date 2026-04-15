import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { IconPlus, IconTrash } from "@tabler/icons-react";

export default function IngredientsSection({
    ingredients,
    unitOptions,
    onAddIngredient,
    onRemoveIngredient,
    onIngredientChange,
    error,
}) {
    return (
        <section className="space-y-3">
            <p className="text-sm font-medium text-foreground">Ingredients <span className="text-primary">*</span></p>

            {ingredients.map((ingredient, index) => (
                <div key={ingredient.id} className="grid grid-cols-1 gap-2 rounded-lg border border-input bg-white p-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
                    <div className="space-y-1">
                        <Label htmlFor={`ingredient-name-${ingredient.id}`}>Name</Label>
                        <Input
                            id={`ingredient-name-${ingredient.id}`}
                            value={ingredient.name}
                            onChange={(event) => onIngredientChange(index, "name", event.target.value)}
                            placeholder="Rice Flour"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor={`ingredient-amount-${ingredient.id}`}>Amount</Label>
                        <Input
                            id={`ingredient-amount-${ingredient.id}`}
                            type="number"
                            min="0"
                            value={ingredient.amount}
                            onChange={(event) => onIngredientChange(index, "amount", event.target.value)}
                            placeholder="100"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label>Unit</Label>
                        <Select
                            value={ingredient.unit}
                            onValueChange={(value) => onIngredientChange(index, "unit", value)}
                        >
                            <SelectTrigger className="h-8 w-full bg-white">
                                <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                                {unitOptions.map((unit) => (
                                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => onRemoveIngredient(index)}
                        disabled={ingredients.length <= 1}
                        className="size-8"
                    >
                        <IconTrash className="size-4" />
                    </Button>
                </div>
            ))}

            {error ? <p className="text-xs text-destructive">{error}</p> : null}

            <Button type="button" variant="outline" size="sm" onClick={onAddIngredient} className="gap-1 text-primary">
                <IconPlus className="size-3.5" />
                Add Ingredient
            </Button>
        </section>
    );
}
