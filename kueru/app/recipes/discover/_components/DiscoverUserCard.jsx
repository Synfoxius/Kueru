import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { IconChefHat, IconUsers } from "@tabler/icons-react";

const formatCount = (value) => Number(value ?? 0).toLocaleString();

const getInitials = (username) => {
    if (!username) return "NA";
    const parts = username.trim().split(/\s+/);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return username.slice(0, 2).toUpperCase();
};

export default function DiscoverUserCard({ user }) {
    const displayName = user?.username || "Unknown User";
    const profileHref = user?.id ? `/profile?userId=${user.id}` : "/profile";
    const recipeCount = Array.isArray(user?.createdRecipes) ? user.createdRecipes.length : Number(user?.createdRecipesCount ?? 0);

    return (
        <Card className="w-[170px] shrink-0 border-border bg-card">
            <CardContent className="flex flex-col items-center gap-3 px-4 py-0 text-center">
                <Avatar size="lg" className="size-20 border border-border">
                    {user?.profileImage ? <AvatarImage src={user.profileImage} alt={displayName} /> : null}
                    <AvatarFallback className="bg-primary/10 text-primary">{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <p className="line-clamp-1 text-sm font-semibold text-foreground">{displayName}</p>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <IconChefHat className="size-3.5" />
                        <span>{formatCount(recipeCount)} recipes</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <IconUsers className="size-3.5" />
                        <span>{formatCount(user?.followerCount)} followers</span>
                    </div>
                </div>

                <Button asChild className="w-full">
                    <Link href={profileHref}>View Profile</Link>
                </Button>
            </CardContent>
        </Card>
    );
}
