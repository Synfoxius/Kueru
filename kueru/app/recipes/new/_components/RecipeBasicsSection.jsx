import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { IconSparkles } from "@tabler/icons-react";

export default function RecipeBasicsSection({
    recipeName,
    description,
    onRecipeNameChange,
    onDescriptionChange,
    onOpenVideoConverter,
    videoConverterLoading,
    errors,
}) {
    return (
        <section className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Create New Recipe</h2>

            <Button
                type="button"
                variant="outline"
                className="convert-video-button gap-2 border-amber-300/70 bg-amber-50/45 text-amber-900 hover:bg-amber-100/70"
                onClick={onOpenVideoConverter}
                disabled={videoConverterLoading}
            >
                <IconSparkles className="size-4 text-primary" />
                {videoConverterLoading ? "Converting..." : "Convert Video"}
            </Button>

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
