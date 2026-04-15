import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IconPlus, IconTrash } from "@tabler/icons-react";

export default function StepsSection({
    steps,
    availableIngredients,
    onAddStep,
    onRemoveStep,
    onStepInstructionChange,
    onToggleStepIngredient,
    error,
}) {
    return (
        <section className="space-y-3">
            <p className="text-sm font-medium text-foreground">Steps <span className="text-primary">*</span></p>

            {steps.map((step, index) => (
                <div key={step.id} className="rounded-lg border border-input bg-white p-4">
                    <div className="flex items-start gap-3">
                        <span className="text-4xl font-bold leading-none text-muted">{index + 1}</span>
                        <div className="min-w-0 flex-1 space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor={`step-instruction-${step.id}`}>Instructions <span className="text-primary">*</span></Label>
                                <Textarea
                                    id={`step-instruction-${step.id}`}
                                    value={step.instruction}
                                    onChange={(event) => onStepInstructionChange(index, event.target.value)}
                                    placeholder="Describe this step in detail..."
                                    className="min-h-20 bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">Relevant Ingredients (Optional)</p>
                                {availableIngredients.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {availableIngredients.map((ingredientName) => {
                                            const isChecked = step.ingredientNames.includes(ingredientName);
                                            return (
                                                <label key={`${step.id}-${ingredientName}`} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-input px-2 py-1 text-xs text-foreground">
                                                    <Checkbox
                                                        checked={isChecked}
                                                        onCheckedChange={() => onToggleStepIngredient(index, ingredientName)}
                                                    />
                                                    <span>{ingredientName}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">Add ingredients to enable selection.</p>
                                )}
                            </div>

                            <Button type="button" variant="destructive" size="sm" onClick={() => onRemoveStep(index)} className="gap-1" disabled={steps.length <= 1}>
                                <IconTrash className="size-3.5" />
                                Remove Step
                            </Button>
                        </div>
                    </div>
                </div>
            ))}

            {error ? <p className="text-xs text-destructive">{error}</p> : null}

            <Button type="button" variant="outline" size="sm" onClick={onAddStep} className="gap-1 text-primary">
                <IconPlus className="size-3.5" />
                Add Step
            </Button>
        </section>
    );
}
