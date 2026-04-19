"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { subscribeUnreadCount } from "@/lib/db/notificationService";

import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuLink,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetClose,
} from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { IconUser, IconLogout, IconSearch, IconPlus, IconLogin, IconSettings, IconUsersGroup, IconBell, IconTrophy, IconMenu2, IconChevronDown } from "@tabler/icons-react";

/**
 * Extracts up to two initials from a username string.
 * e.g. "John Doe" -> "JD", "alice" -> "AL"
 */
function getInitials(username) {
    if (!username) return "";
    const parts = username.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.slice(0, 2).toUpperCase();
}

/** Recipe dropdown sub-links */
const recipeLinks = [
    { label: "Discover", href: "/recipes/discover" },
    { label: "For You", href: "/recipes/foryou" },
    { label: "Search", href: "/recipes/find", icon: IconSearch },
    { label: "New Recipe", href: "/recipes/new", icon: IconPlus },
];

export default function Navbar() {
    const { user, userDoc, handleSignOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) { setUnreadCount(0); return; }
        const unsub = subscribeUnreadCount(user.uid, setUnreadCount);
        return unsub;
    }, [user]);

    const isRecipeActive = pathname.startsWith("/recipes");
    const isChallengesActive = pathname.startsWith("/challenges");
    const isForumActive = pathname.startsWith("/forum");

    const handleLogout = async () => {
        toast.success("Successfully logged out.");
        await handleSignOut();
        router.push("/");
    };

    const profileImage = userDoc?.profileImage || null;
    const username = userDoc?.username || "";

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
                {/* Left section: Logo + Navigation */}
                <div className="flex items-center gap-3 md:gap-6">
                    {/* Mobile nav drawer */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="md:hidden"
                                aria-label="Open navigation menu"
                            >
                                <IconMenu2 className="size-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
                            <SheetHeader className="border-b border-border">
                                <SheetTitle>Navigation</SheetTitle>
                            </SheetHeader>
                            <div className="flex flex-col p-3">
                                <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recipes</p>
                                {recipeLinks.map((link) => (
                                    <SheetClose asChild key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-muted"
                                        >
                                            {link.icon ? <link.icon className="size-4" /> : null}
                                            {link.label}
                                        </Link>
                                    </SheetClose>
                                ))}

                                <div className="my-2 h-px bg-border" />

                                <SheetClose asChild>
                                    <Link href="/challenges" className="rounded-md px-2 py-2 text-sm font-medium hover:bg-muted">
                                        Challenges
                                    </Link>
                                </SheetClose>
                                <SheetClose asChild>
                                    <Link href="/forum" className="rounded-md px-2 py-2 text-sm font-medium hover:bg-muted">
                                        Forum
                                    </Link>
                                </SheetClose>
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Logo */}
                    <Link href="/" className="flex shrink-0 items-center">
                        <Image
                            src="/logo.png"
                            alt="Kueru logo"
                            width={40}
                            height={40}
                            className="h-10 w-auto"
                            priority
                        />
                    </Link>

                    {/* Navigation tabs */}
                    <NavigationMenu className="hidden md:block">
                        <NavigationMenuList className="gap-1">
                            {/* Recipe tab with dropdown */}
                            <NavigationMenuItem>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className={`${navigationMenuTriggerStyle()} ${isRecipeActive ? "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90" : ""} data-[state=open]:bg-primary data-[state=open]:text-primary-foreground data-[state=open]:hover:bg-primary/90 data-[state=open]:focus:bg-primary/90`}
                                        >
                                            <span>Recipes</span>
                                            <IconChevronDown className="size-4 opacity-70" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="min-w-[180px]">
                                        {recipeLinks.map((link) => (
                                            <DropdownMenuItem asChild key={link.href}>
                                                <Link
                                                    href={link.href}
                                                    className="flex items-center gap-2 px-4 py-2 text-base font-medium"
                                                >
                                                    {link.icon ? <link.icon className="size-4" /> : null}
                                                    {link.label}
                                                </Link>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </NavigationMenuItem>

                            {/* Challenges */}
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} ${isChallengesActive ? "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90" : ""}`}>
                                    <Link href="/challenges">
                                        Challenges
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>

                            {/* Forum */}
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} ${isForumActive ? "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90" : ""}`}>
                                    <Link href="/forum">
                                        Forum
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                {/* Right section: Bell + Profile avatar */}
                <div className="flex items-center gap-1.5 sm:gap-3">
                {user && (
                    <Link
                        href="/users/notifications"
                        className="relative rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        aria-label="Notifications"
                    >
                        <IconBell className="size-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white leading-none">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </Link>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="rounded-full outline-none ring-offset-background transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            aria-label="Open user menu"
                        >
                            <Avatar size="lg" className="cursor-pointer bg-primary">
                                {profileImage ? (
                                    <AvatarImage src={profileImage} alt={username} />
                                ) : null}
                                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                                    {username ? getInitials(username) : <IconUser className="size-4" />}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        {user ? (
                            <>
                                <DropdownMenuItem asChild>
                                    <Link href="/profile" className="cursor-pointer gap-2">
                                        <IconUser className="size-4" />
                                        My Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/achievements" className="cursor-pointer gap-2">
                                        <IconTrophy className="size-4" />
                                        Achievements
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/users/discover" className="cursor-pointer gap-2">
                                        <IconUsersGroup className="size-4" />
                                        Discover Users
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/settings" className="cursor-pointer gap-2">
                                        <IconSettings className="size-4" />
                                        Account Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                    <IconLogout className="size-4" />
                                    Log Out
                                </DropdownMenuItem>
                            </>
                        ) : (
                            <DropdownMenuItem asChild>
                                <Link href="/login" className="cursor-pointer gap-2 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 focus:bg-primary/90">
                                    <IconLogin className="size-4" />
                                    Login
                                </Link>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
                </div>
            </div>
        </nav>
    );
}
