"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { IconUserPlus, IconUserCheck, IconEdit, IconLogout } from "@tabler/icons-react";

import { useAuth } from "@/context/AuthContext";
import { logout } from "@/lib/firebase/auth";
import { getUserByUsername } from "@/lib/db/userService";
import { getRecipesByUser } from "@/lib/db/recipeService";
import { checkIfFollowing, followUser, unfollowUser } from "@/lib/db/followService";

import Navbar from "@/components/Navbar";
import RecipeCard from "@/components/RecipeCard";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import UserPosts from "@/app/profile/_components/UserPosts";

function getInitials(username) {
    if (!username) return "";
    const parts = username.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return username.slice(0, 2).toUpperCase();
}

function ForumPostCard({ post }) {
    const date = post.postedDateTime?.toDate?.()?.toLocaleDateString() ?? "";
    return (
        <div className="rounded-xl border border-border bg-card p-4 space-y-1 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm line-clamp-2">{post.title}</p>
                {post.postCategory && (
                    <span className="shrink-0 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                        {post.postCategory}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {date && <span>{date}</span>}
                <span>▲ {post.upvotesCount ?? 0}</span>
                <span>💬 {post.commentsCount ?? 0}</span>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const { username } = useParams();
    const router = useRouter();
    const { user: currentUser, loading: authLoading } = useAuth();

    const [profileUser, setProfileUser] = useState(null);
    const [recipes, setRecipes] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        const fetchProfile = async () => {
            setPageLoading(true);
            const user = await getUserByUsername(username);
            if (!user) { setNotFound(true); setPageLoading(false); return; }

            setProfileUser(user);

            const recipesData = await getRecipesByUser(username).catch(() => ({ recipes: [] }));
            setRecipes(recipesData.recipes ?? []);

            if (currentUser && currentUser.uid !== user.userId) {
                const following = await checkIfFollowing(currentUser.uid, user.userId).catch(() => false);
                setIsFollowing(following);
            }

            setPageLoading(false);
        };

        fetchProfile();
    }, [username, authLoading, currentUser]);

    const isOwnProfile = currentUser?.uid === profileUser?.userId;

    const handleFollowToggle = async () => {
        if (!currentUser) { router.push("/login"); return; }
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await unfollowUser(currentUser.uid, profileUser.userId);
                setIsFollowing(false);
                setProfileUser(prev => ({ ...prev, followerCount: (prev.followerCount ?? 1) - 1 }));
            } else {
                await followUser(currentUser.uid, profileUser.userId);
                setIsFollowing(true);
                setProfileUser(prev => ({ ...prev, followerCount: (prev.followerCount ?? 0) + 1 }));
            }
        } finally {
            setFollowLoading(false);
        }
    };

    if (authLoading || pageLoading) {
        return (
            <>
                <Navbar />
                <div className="flex h-[60vh] items-center justify-center text-muted-foreground text-sm">
                    Loading...
                </div>
            </>
        );
    }

    if (notFound) {
        return (
            <>
                <Navbar />
                <div className="flex h-[60vh] items-center justify-center text-muted-foreground text-sm">
                    User not found.
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <main className="mx-auto max-w-3xl px-4 py-8">

                {/* Profile header */}
                <div className="flex items-start gap-6">
                    <Avatar className="size-28 shrink-0 text-3xl font-bold bg-primary text-primary-foreground">
                        {profileUser.profileImage
                            ? <AvatarImage src={profileUser.profileImage} alt={profileUser.username} />
                            : null}
                        <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                            {getInitials(profileUser.username)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        {/* Username + action button */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h1 className="text-2xl font-bold">@{profileUser.username}</h1>
                            {isOwnProfile ? (
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="gap-1.5">
                                        <IconEdit className="size-4" /> Edit Profile
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-1.5 text-muted-foreground hover:text-destructive"
                                        onClick={() => logout().then(() => router.push("/login"))}
                                    >
                                        <IconLogout className="size-4" /> Logout
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    size="sm"
                                    variant={isFollowing ? "outline" : "default"}
                                    onClick={handleFollowToggle}
                                    disabled={followLoading}
                                    className="gap-1.5"
                                >
                                    {isFollowing
                                        ? <><IconUserCheck className="size-4" /> Unfollow</>
                                        : <><IconUserPlus className="size-4" /> Follow</>
                                    }
                                </Button>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="mt-3 flex gap-6 text-sm">
                            <span><strong>{recipes.length}</strong> <span className="text-muted-foreground">recipes</span></span>
                            <span><strong>{profileUser.followerCount ?? 0}</strong> <span className="text-muted-foreground">followers</span></span>
                            <span><strong>{profileUser.followingCount ?? 0}</strong> <span className="text-muted-foreground">following</span></span>
                        </div>

                        {/* Bio */}
                        {profileUser.bio && (
                            <p className="mt-3 text-sm text-muted-foreground">{profileUser.bio}</p>
                        )}
                    </div>
                </div>

                <Separator className="my-6" />

                {/* Tabs */}
                <Tabs defaultValue="recipes">
                    <TabsList className="mb-6">
                        <TabsTrigger value="recipes">Recipes</TabsTrigger>
                        <TabsTrigger value="forums">Forums</TabsTrigger>
                    </TabsList>

                    <TabsContent value="recipes">
                        {recipes.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                {recipes.map(r => <RecipeCard key={r.id} recipe={r} />)}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No recipes yet.</p>
                        )}
                    </TabsContent>

                    <TabsContent value="forums">
                        <UserPosts userId={profileUser.userId} />
                    </TabsContent>
                </Tabs>
            </main>
        </>
    );
}
