import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RecipeMetaSection({
    cookTime,
    servings,
    onCookTimeChange,
    onServingsChange,
    errors,
}) {
    return (
        <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Recipe Information</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="recipe-time">Estimated Cook Time (minutes)</Label>
                    <Input
                        id="recipe-time"
                        type="number"
                        min="1"
                        value={cookTime}
                        onChange={(event) => onCookTimeChange(event.target.value)}
                        className="h-10 bg-white"
                        aria-invalid={errors.time ? "true" : "false"}
                    />
                    {errors.time ? <p className="text-xs text-destructive">{errors.time}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="recipe-servings">Serving Portions</Label>
                    <Input
                        id="recipe-servings"
                        type="number"
                        min="1"
                        value={servings}
                        onChange={(event) => onServingsChange(event.target.value)}
                        className="h-10 bg-white"
                        aria-invalid={errors.servings ? "true" : "false"}
                    />
                    {errors.servings ? <p className="text-xs text-destructive">{errors.servings}</p> : null}
                </div>
            </div>
        </section>
    );
}
