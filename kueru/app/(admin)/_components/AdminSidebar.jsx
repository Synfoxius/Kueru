"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
    IconLayoutDashboard,
    IconUsers,
    IconBook,
    IconMessage,
    IconShieldCheck,
    IconLogout,
} from "@tabler/icons-react";

const navLinks = [
    { label: "Dashboard", href: "/admin/dashboard", icon: IconLayoutDashboard },
    { label: "Users", href: "/admin/users", icon: IconUsers },
    { label: "Recipes", href: "/admin/recipes", icon: IconBook },
    { label: "Forum", href: "/admin/forum", icon: IconMessage },
    { label: "Verifications", href: "/admin/verifications", icon: IconShieldCheck },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/");
    };

    return (
        <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-border bg-card">
            {/* Header */}
            <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
                <Image
                    src="/logo.png"
                    alt="Kueru"
                    width={28}
                    height={28}
                    className="h-7 w-auto"
                />
                <div className="leading-tight">
                    <p className="text-sm font-bold">Kueru</p>
                    <p className="text-xs text-muted-foreground">Admin Panel</p>
                </div>
            </div>

            {/* Nav links */}
            <nav className="flex flex-1 flex-col gap-1 p-2 pt-3">
                {navLinks.map(({ label, href, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className={cn(
                            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            pathname.startsWith(href)
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        <Icon className="size-4 shrink-0" />
                        {label}
                    </Link>
                ))}
            </nav>

            <Separator />

            {/* Logout */}
            <div className="p-2">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleLogout}
                >
                    <IconLogout className="size-4" />
                    Log Out
                </Button>
            </div>
        </aside>
    );
}
