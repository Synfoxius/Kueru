import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { IconTrendingUp, IconArrowUp } from "@tabler/icons-react";

export default function TrendingPanel({ posts }) {
    return (
        <Card className="bg-white">
            <CardContent className="p-4">

                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                    <IconTrendingUp className="size-4 text-primary" />
                    <h3 className="font-semibold text-sm">Trending</h3>
                </div>

                {/* Post list */}
                <ol className="space-y-3">
                    {posts.map((post, index) => (
                        <li key={post.id} className="flex items-start gap-3">

                            {/* Rank number */}
                            <span className="text-muted-foreground text-xs w-4 shrink-0 mt-0.5 font-medium">
                                {index + 1}.
                            </span>

                            {/* Post info */}
                            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                <Link
                                    href={`/forum/${post.id}`}
                                    className="text-xs font-medium text-foreground hover:text-primary hover:underline line-clamp-2 leading-snug"
                                >
                                    {post.title}
                                </Link>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <IconArrowUp className="size-3" />
                                    <span>{post.upvotesCount ?? 0} votes</span>
                                </div>
                            </div>

                        </li>
                    ))}
                </ol>

            </CardContent>
        </Card>
    );
}