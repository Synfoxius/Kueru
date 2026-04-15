import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function RecipeBasicsSection({
    recipeName,
    description,
    onRecipeNameChange,
    onDescriptionChange,
    errors,
}) {
    return (
        <section className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Create New Recipe</h2>

            <div className="space-y-1.5">
                <Label htmlFor="recipe-name">Name of Recipe <span className="text-primary">*</span></Label>
                <Input
                    id="recipe-name"
                    value={recipeName}
                    onChange={(event) => onRecipeNameChange(event.target.value)}
                    placeholder="Some food"
                    aria-invalid={errors.recipeName ? "true" : "false"}
                    className="h-10 bg-white"
                />
                {errors.recipeName ? <p className="text-xs text-destructive">{errors.recipeName}</p> : null}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="recipe-description">Description <span className="text-primary">*</span></Label>
                <Textarea
                    id="recipe-description"
                    value={description}
                    onChange={(event) => onDescriptionChange(event.target.value)}
                    placeholder="Describe your recipe"
                    className="min-h-28 bg-white"
                    aria-invalid={errors.description ? "true" : "false"}
                />
                {errors.description ? <p className="text-xs text-destructive">{errors.description}</p> : null}
            </div>
        </section>
    );
}
