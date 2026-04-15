"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { IconUserPlus, IconUserCheck, IconEdit } from "@tabler/icons-react";

import { useAuth } from "@/context/AuthContext";
import { getUserByUsername } from "@/lib/db/userService";
import { getRecipesByUser } from "@/lib/db/recipeService";
import { checkIfFollowing, followUser, unfollowUser } from "@/lib/db/followService";

import Link from "next/link";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import RecipeCard from "@/components/RecipeCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import UserPosts from "@/app/profile/_components/UserPosts";
import { getInitials } from "@/app/profile/_components/getInitials";

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
    const [showLoginModal, setShowLoginModal] = useState(false);

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
                <ConditionalNavbar />
                <div className="flex h-[60vh] items-center justify-center text-muted-foreground text-sm">
                    Loading...
                </div>
            </>
        );
    }

    if (notFound) {
        return (
            <>
                <ConditionalNavbar />
                <div className="flex h-[60vh] items-center justify-center text-muted-foreground text-sm">
                    User not found.
                </div>
            </>
        );
    }

    return (
        <>
            <ConditionalNavbar />
                <main className="mx-auto max-w-6xl px-4 py-8">

                {/* Profile header */}
                <div className="flex items-center gap-8">
                    <Avatar className="size-32 shrink-0 text-4xl font-bold">
                        {profileUser.profileImage
                            ? <AvatarImage src={profileUser.profileImage} alt={profileUser.username} />
                            : null}
                        <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-bold">
                            {getInitials(profileUser.username)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 space-y-3">
                        {/* Username + action buttons */}
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold">@{profileUser.username}</h1>
                            
                        </div>

                        {/* Stats */}
                        <div className="flex gap-8 text-sm">
                            <span><strong className="text-base">{recipes.length}</strong> <span className="text-muted-foreground">recipes</span></span>
                            <span><strong className="text-base">{profileUser.followerCount ?? 0}</strong> <span className="text-muted-foreground">followers</span></span>
                            <span><strong className="text-base">{profileUser.followingCount ?? 0}</strong> <span className="text-muted-foreground">following</span></span>
                        </div>

                        {/* Display name + Bio */}
                        {profileUser.displayName && (
                            <p className="text-sm font-medium">{profileUser.displayName}</p>
                        )}
                        {profileUser.bio && (
                            <p className="text-sm text-muted-foreground">{profileUser.bio}</p>
                        )}

                        
                    </div>
                </div>

                <div className="flex justify-center py-4">
                    {isOwnProfile ? (
                        <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={() => router.push("/profile/edit")}>
                            <IconEdit className="size-4" /> Edit Profile
                        </Button>
                    ) : !currentUser ? (
                        <Button size="sm" className="gap-1.5 w-full" onClick={() => setShowLoginModal(true)}>
                            <IconUserPlus className="size-4" /> Follow
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant={isFollowing ? "outline" : "default"}
                            onClick={handleFollowToggle}
                            disabled={followLoading}
                            className="gap-1.5 w-full"
                        >
                            {isFollowing
                                ? <><IconUserCheck className="size-4" /> Unfollow</>
                                : <><IconUserPlus className="size-4" /> Follow</>
                            }
                        </Button>
                    )}
                </div>

                {/* Tabs */}
                <Tabs defaultValue="recipes">
                    <TabsList variant="line" className="w-full flex gap-0 border-b border-border rounded-none h-auto p-0 mb-6">
                        <TabsTrigger
                            value="recipes"
                            className="flex-1 py-3 text-sm font-semibold data-active:bg-transparent data-active:text-primary data-active:border-transparent after:bg-primary"
                        >
                            My Recipes
                        </TabsTrigger>
                        <TabsTrigger
                            value="forums"
                            className="flex-1 py-3 text-sm font-semibold data-active:bg-transparent data-active:text-primary data-active:border-transparent after:bg-primary"
                        >
                            My Forums
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="recipes">
                        {recipes.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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

            <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
                <DialogContent className="max-w-sm text-center">
                    <DialogHeader>
                        <DialogTitle>Sign in to follow</DialogTitle>
                        <DialogDescription>
                            Create an account or log in to follow {profileUser?.username} and see their latest recipes.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 mt-2">
                        <Button asChild className="w-full" onClick={() => setShowLoginModal(false)}>
                            <Link href="/login">Log In</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full" onClick={() => setShowLoginModal(false)}>
                            <Link href="/register">Sign Up</Link>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
