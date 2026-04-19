"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { IconUserPlus, IconUserCheck, IconEdit, IconShieldCheckFilled, IconFlag, IconDotsVertical } from "@tabler/icons-react";

import { useAuth } from "@/context/AuthContext";
import { getUserByUsername } from "@/lib/db/userService";
import { getRecipesByUser } from "@/lib/db/recipeService";
import { checkIfFollowing, followUser, unfollowUser } from "@/lib/db/followService";
import { createReport } from "@/lib/db/reportService";
import ReportDialog from "@/components/ReportDialog";
import { toast } from "sonner";

import Link from "next/link";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import RecipeCard from "@/components/RecipeCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
    const [showReportDialog, setShowReportDialog] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        const fetchProfile = async () => {
            setPageLoading(true);
            const user = await getUserByUsername(username);
            if (!user) { setNotFound(true); setPageLoading(false); return; }

            setProfileUser(user);

            const recipesData = await getRecipesByUser(user.userId).catch((err) => { console.error('[Profile] getRecipesByUser failed:', err); return { recipes: [] }; });
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

    const handleReport = async (reason, details) => {
        await createReport(profileUser.userId, "user", currentUser.uid, reason, details);
        setShowReportDialog(false);
        toast.success("User reported. Our moderators will review it.");
    };

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
            <title>{profileUser ? `@${profileUser.username} | Kueru` : "Profile | Kueru"}</title>
            <ConditionalNavbar />
                <main className="w-full px-8 sm:px-12 lg:px-20 py-8">

                {/* Profile header */}
                <div className="relative flex items-center gap-8">
                    {!isOwnProfile && currentUser && (
                        <div className="absolute top-0 right-0">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
                                        <IconDotsVertical className="size-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive gap-2"
                                        onClick={() => setShowReportDialog(true)}
                                    >
                                        <IconFlag className="size-4" /> Report User
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                    <Avatar className="size-32 shrink-0 text-4xl font-bold">
                        {profileUser.profileImage
                            ? <AvatarImage src={profileUser.profileImage} alt={profileUser.username} />
                            : null}
                        <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-bold">
                            {getInitials(profileUser.username)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 space-y-3">
                        {/* Username + verified badge */}
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-bold">@{profileUser.username}</h1>
                            {profileUser.verified && (
                                <IconShieldCheckFilled className="size-5 text-amber-500" title="Verified Chef" />
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex gap-8 text-sm">
                            <span><strong className="text-base">{recipes.length}</strong> <span className="text-muted-foreground">recipes</span></span>
                            <Link href={`/profile/${profileUser.username}/connections?tab=followers`} className="hover:underline">
                                <strong className="text-base">{profileUser.followerCount ?? 0}</strong> <span className="text-muted-foreground">followers</span>
                            </Link>
                            <Link href={`/profile/${profileUser.username}/connections?tab=following`} className="hover:underline">
                                <strong className="text-base">{profileUser.followingCount ?? 0}</strong> <span className="text-muted-foreground">following</span>
                            </Link>
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

                <div className="flex justify-center gap-2 py-4">
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
                            Recipes
                        </TabsTrigger>
                        <TabsTrigger
                            value="forums"
                            className="flex-1 py-3 text-sm font-semibold data-active:bg-transparent data-active:text-primary data-active:border-transparent after:bg-primary"
                        >
                            Forums
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
                        <UserPosts userId={profileUser.userId} hiddenPostIds={profileUser.hiddenPosts ?? []} />
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
                            <Link href={`/login?returnTo=/profile/${profileUser?.username}`}>Log In</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full" onClick={() => setShowLoginModal(false)}>
                            <Link href="/register">Sign Up</Link>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <ReportDialog
                open={showReportDialog}
                onCancel={() => setShowReportDialog(false)}
                onSubmit={handleReport}
                title="Report user"
                description={`Help us understand what's wrong with @${profileUser?.username}.`}
            />
        </>
    );
}
