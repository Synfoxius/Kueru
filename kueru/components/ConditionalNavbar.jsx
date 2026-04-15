"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";

export default function ConditionalNavbar() {
    const { user, loading } = useAuth();

    if (!loading && user) {
        return <Navbar />;
    }

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/logo.png" alt="Kueru" width={36} height={36} className="h-9 w-auto" priority />
                    <span className="font-bold text-lg">Kueru</span>
                </Link>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/login">Log In</Link>
                    </Button>
                    <Button size="sm" asChild>
                        <Link href="/register">Sign Up</Link>
                    </Button>
                </div>
            </div>
        </nav>
    );
}
