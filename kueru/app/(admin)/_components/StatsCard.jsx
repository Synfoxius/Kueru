import { Card, CardContent } from "@/components/ui/card";

/**
 * Displays a single stat with a title, large value, optional icon, and optional description.
 *
 * @param {{ title: string, value: string|number, icon?: React.ElementType, description?: string }} props
 */
export default function StatsCard({ title, value, icon: Icon, description }) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="mt-1 text-3xl font-bold">{value ?? "—"}</p>
                        {description && (
                            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                        )}
                    </div>
                    {Icon && (
                        <div className="rounded-md bg-primary/10 p-2">
                            <Icon className="size-5 text-primary" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
