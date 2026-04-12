import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RecipeOfTheDay({ recipe }) {
    return (
        <Card className="relative overflow-hidden w-full py-0">
            <CardContent className="p-0">
                <div className="relative h-44 w-full bg-muted">
                    {recipe.images?.[0] && (
                        <Image
                            src={recipe.images[0]}
                            alt={recipe.name}
                            fill
                            className="object-cover brightness-60"
                        />
                    )}
                    <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                        <span className="w-fit rounded-full bg-yellow-400 px-3 py-0.5 text-xs font-semibold text-black">
                            ★ Recipe of the Day
                        </span>
                        <div>
                            <h2 className="text-lg font-bold text-white leading-tight">{recipe.name}</h2>
                            <p className="text-xs text-white/80 mt-1 max-w-xs line-clamp-2">{recipe.description}</p>
                            <p className="text-xs text-white/60 mt-1">By @{recipe.username}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                                {recipe.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Visit button — absolutely centered on the right */}
                    <div className="absolute right-4 inset-y-0 flex items-center">
                        <Button size="sm" className="rounded-full">
                            Visit →
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}