"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
// import { Button } from "@/components/ui/button";
// import UserPosts from "./_components/UserPosts";

export default function ProfilePage() {
    const router = useRouter();
    const { user, userDoc, loading } = useAuth();

    useEffect(() => {
        if (loading) return;
        if (!user) { router.push("/login"); return; }
        if (userDoc?.username) router.replace(`/profile/${userDoc.username}`);
    }, [loading, user, userDoc, router]);

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    if (loading || !user) return null;

    // return (
    //     <div className="flex h-screen flex-col items-center justify-center gap-6">
    //         <h1 className="text-3xl font-bold">Welcome!</h1>
    //         <Button variant="outline" onClick={handleLogout}>Log Out</Button>

    //         <UserPosts userId={user.uid} />
    //     </div>
    // );
    return null;
}
