import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";

export default function RecipeStepsPanel({
    steps = [],
    started,
    activeStepIndex,
    canGoPrevious,
    canGoNext,
    onPrevious,
    onNext,
    scaleAmount,
    formatAmount,
}) {
    return (
        <section className="space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">Steps</h2>
            {steps.length === 0 ? (
                <Card className="border-border bg-white">
                    <CardContent className="p-4 text-sm text-muted-foreground">No steps were provided for this recipe.</CardContent>
                </Card>
            ) : (
                steps.map((step, index) => {
                    const isActive = started && index === activeStepIndex;
                    const stepIngredients = Object.entries(step.ingredients || {});

                    return (
                        <Card
                            key={`${step.instruction}-${index}`}
                            className={isActive ? "border-primary bg-primary/5" : "border-border bg-white"}
                        >
                            <CardHeader className="pb-0">
                                <CardTitle className="flex items-start gap-3">
                                    <span className={isActive ? "text-primary" : "text-muted-foreground"}>{index + 1}</span>
                                    <span className="text-base leading-relaxed text-foreground">{step.instruction}</span>
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-3 pt-3">
                                {stepIngredients.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {stepIngredients.map(([ingredientName, amountAndUnit]) => {
                                            const rawAmount = Number(amountAndUnit?.[0]);
                                            const unit = String(amountAndUnit?.[1] ?? "").trim();
                                            const scaledAmount = scaleAmount(rawAmount);
                                            const label = unit
                                                ? `${formatAmount(scaledAmount)} ${unit} ${ingredientName}`
                                                : `${formatAmount(scaledAmount)} ${ingredientName}`;

                                            return (
                                                <span
                                                    key={`${index}-${ingredientName}`}
                                                    className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-foreground"
                                                >
                                                    {label}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}

                                {isActive && (
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={onPrevious}
                                            disabled={!canGoPrevious}
                                        >
                                            <IconChevronUp className="size-4" />
                                            Previous
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={onNext}
                                            disabled={!canGoNext}
                                        >
                                            <IconChevronDown className="size-4" />
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })
            )}
        </section>
    );
}
