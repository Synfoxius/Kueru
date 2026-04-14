"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
    const router = useRouter();
    const { user, userDoc, loading } = useAuth();

    useEffect(() => {
        if (loading) return;
        if (!user) { router.push("/login"); return; }
        if (userDoc?.username) router.replace(`/profile/${userDoc.username}`);
    }, [loading, user, userDoc, router]);

    return null;
}
