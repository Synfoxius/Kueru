import { Card, CardContent } from "@/components/ui/card";
import { IconTrendingUp } from "@tabler/icons-react";

export default function TrendingPanel({ topics }) {
    return (
        <Card className="bg-white">
            <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                    <IconTrendingUp className="size-4 text-primary" />
                    <h3 className="font-semibold text-sm">Trending</h3>
                </div>
                <ol className="space-y-2">
                    {topics.map((topic, index) => (
                        <li key={topic} className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground w-4 shrink-0">{index + 1}.</span>
                            <button className="text-foreground hover:text-primary hover:underline text-left">
                                {topic}
                            </button>
                        </li>
                    ))}
                </ol>
            </CardContent>
        </Card>
    );
}