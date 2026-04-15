import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IconClock, IconUsers } from "@tabler/icons-react";

const formatTagKey = (tag) => String(tag ?? "").trim().toLowerCase().replace(/\s+/g, "-");

export default function RecipeInfoPanel({
    tags = [],
    time,
    servings,
    desiredServings,
    onDesiredServingsChange,
    onStart,
    hasSteps,
    started,
}) {
    return (
        <Card className="border-border bg-white">
            <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap gap-2">
                    {tags.length > 0 ? (
                        tags.map((tag) => (
                            <span
                                key={formatTagKey(tag)}
                                className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-foreground"
                            >
                                {tag}
                            </span>
                        ))
                    ) : (
                        <span className="text-xs text-muted-foreground">No tags available.</span>
                    )}
                </div>

                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <IconClock className="size-4" />
                        <span>{Number(time || 0)} mins</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <IconUsers className="size-4" />
                        <span>{Number(servings || 0)} servings</span>
                    </div>
                    <label className="space-y-1 text-xs text-muted-foreground">
                        <span className="block">Desired servings</span>
                        <Input
                            type="number"
                            min="1"
                            step="0.25"
                            value={desiredServings}
                            onChange={onDesiredServingsChange}
                            className="w-28"
                        />
                    </label>
                    <Button type="button" onClick={onStart} disabled={!hasSteps}>
                        {started ? "Restart" : "Start"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
