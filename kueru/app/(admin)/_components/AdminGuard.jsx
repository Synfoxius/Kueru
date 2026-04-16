"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Wraps admin pages. Redirects to "/admin/login" if the user is not
 * authenticated or does not hold the "admin" role. Shows a loading state
 * while auth resolves.
 */
export default function AdminGuard({ children }) {
    const { user, userDoc, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!user || userDoc?.role !== "admin") {
            router.replace("/admin/login");
        }
    }, [user, userDoc, loading, router]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (!user || userDoc?.role !== "admin") {
        return null;
    }

    return children;
}
