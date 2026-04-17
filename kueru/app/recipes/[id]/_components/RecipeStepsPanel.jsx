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
                            className={isActive ? "border-primary bg-primary/10 ring-1 ring-primary/40" : "border-border bg-white"}
                        >
                            <CardHeader className="pb-0">
                                <CardTitle className="flex items-start gap-3">
                                    <span className={`text-4xl font-bold leading-none ${isActive ? "text-black" : "text-muted"}`}>{index + 1}</span>
                                    <span className="text-base leading-relaxed text-foreground">{step.instruction}</span>
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-3 pt-3 pb-0">
                                {isActive && stepIngredients.length > 0 && (
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
                                                    className="rounded-full border border-accent bg-accent px-3 py-1 text-xs text-accent-foreground"
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
                                            variant="default"
                                            onClick={onPrevious}
                                            disabled={!canGoPrevious}
                                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                                        >
                                            <IconChevronUp className="size-4" />
                                            Previous
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="default"
                                            onClick={onNext}
                                            disabled={!canGoNext}
                                            className="bg-primary text-primary-foreground hover:bg-primary/90"
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
