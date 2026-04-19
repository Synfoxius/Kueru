import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { IconArrowLeft, IconChefHat, IconChevronDown, IconUsers } from "@tabler/icons-react";

const TOP_OPTIONS = [20, 30, 40, 50];
const MODE_OPTIONS = [
    { value: "chefs", label: "Professional Chefs" },
    { value: "popular", label: "Popular Users" },
];

const formatCount = (value) => Number(value ?? 0).toLocaleString();

const getInitials = (username) => {
    if (!username) return "NA";
    const parts = username.trim().split(/\s+/);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return username.slice(0, 2).toUpperCase();
};

const getRecipeCount = (user) => {
    return Number(user?.createdRecipesCount ?? 0);
};

export default function UserResultsSection({
    mode,
    topCount,
    users,
    loading,
    error,
    hasMore,
    currentUserId,
    followingIdSet,
    pendingFollowIdSet,
    onBack,
    onModeChange,
    onTopCountChange,
    onLoadMore,
    onToggleFollow,
}) {
    const currentModeLabel = MODE_OPTIONS.find((option) => option.value === mode)?.label ?? "Popular Users";

    return (
        <div className="space-y-5">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-sm font-medium text-primary hover:bg-transparent hover:text-primary/80"
                    onClick={onBack}
                >
                    <IconArrowLeft className="size-4" />
                    Back
                </Button>

                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-4xl font-bold leading-none text-foreground">Top</h1>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="h-12 rounded-xl bg-primary px-4 text-3xl font-bold text-primary-foreground hover:bg-primary/90">
                                {topCount}
                                <IconChevronDown className="size-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            {TOP_OPTIONS.map((option) => (
                                <DropdownMenuCheckboxItem
                                    key={option}
                                    checked={topCount === option}
                                    onCheckedChange={() => onTopCountChange(option)}
                                >
                                    {option}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="h-12 rounded-xl bg-primary px-4 text-3xl font-bold text-primary-foreground hover:bg-primary/90">
                                {currentModeLabel}
                                <IconChevronDown className="size-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            {MODE_OPTIONS.map((option) => (
                                <DropdownMenuCheckboxItem
                                    key={option.value}
                                    checked={mode === option.value}
                                    onCheckedChange={() => onModeChange(option.value)}
                                >
                                    {option.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                {loading && users.length === 0 ? <p className="text-sm text-muted-foreground">Loading users...</p> : null}

                {!loading && users.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No users found for this view.</p>
                ) : null}

                {users.length > 0 ? (
                    <div className="space-y-4">
                        {users.map((user) => (
                            <Card key={user.id} className="rounded-2xl border-border bg-card">
                                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex min-w-0 items-center gap-4">
                                        <Avatar className="size-16 border border-primary/30">
                                            {user?.profileImage ? <AvatarImage src={user.profileImage} alt={user?.username || "Unknown User"} /> : null}
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {getInitials(user?.username)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="min-w-0 space-y-1">
                                            <p className="truncate text-2xl font-bold text-foreground">{user?.username || "Unknown User"}</p>
                                            <p className="flex items-center gap-2 text-lg text-muted-foreground">
                                                <IconChefHat className="size-4 text-primary" />
                                                {formatCount(getRecipeCount(user))} recipes
                                            </p>
                                            <p className="flex items-center gap-2 text-lg text-muted-foreground">
                                                <IconUsers className="size-4 text-primary" />
                                                {formatCount(user?.followerCount)} followers
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-36">
                                        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                                            <Link href={user?.username ? `/profile/${user.username}` : "/profile"}>View Profile</Link>
                                        </Button>

                                        {currentUserId ? (
                                            <Button
                                                variant="outline"
                                                className="border-primary text-primary hover:bg-primary/10"
                                                disabled={
                                                    user?.id === currentUserId ||
                                                    !user?.id ||
                                                    pendingFollowIdSet.has(user.id)
                                                }
                                                onClick={() => onToggleFollow(user?.id)}
                                            >
                                                {user?.id === currentUserId
                                                    ? "You"
                                                    : pendingFollowIdSet.has(user.id)
                                                      ? "Updating..."
                                                      : followingIdSet.has(user.id)
                                                        ? "Following"
                                                        : "Follow"}
                                            </Button>
                                        ) : null}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : null}

                {hasMore ? (
                    <div className="flex justify-center">
                        <Button onClick={onLoadMore} disabled={loading}>
                            {loading ? "Loading..." : "Load More"}
                        </Button>
                    </div>
                ) : null}
        </div>
    );
}
