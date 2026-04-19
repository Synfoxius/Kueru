"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    IconUser, IconAdjustments, IconLock, IconLogout, IconHistory,
    IconChevronRight, IconCircleCheck, IconAlertCircle,
} from "@tabler/icons-react";

import { useAuth } from "@/context/AuthContext";
import { resetPassword } from "@/lib/firebase/auth";
import { toast } from "sonner";

import ConditionalNavbar from "@/components/ConditionalNavbar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function SettingRow({ icon: Icon, iconColor = "text-primary", label, description, onClick, disabled, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`w-full flex items-center gap-4 rounded-xl px-4 py-4 text-left transition-colors
                ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/60 cursor-pointer"}`}
        >
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-muted ${iconColor}`}>
                <Icon className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                {children}
            </div>
            {!disabled && <IconChevronRight className="size-4 text-muted-foreground shrink-0" />}
        </button>
    );
}

export default function SettingsPage() {
    const router = useRouter();
    const { user, loading, handleSignOut } = useAuth();

    const [resetStatus, setResetStatus] = useState(null); // null | 'sending' | 'sent' | 'error'

    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [loading, user, router]);

    if (loading || !user) {
        return (
            <>
                <ConditionalNavbar />
                <div className="flex h-[60vh] items-center justify-center text-muted-foreground text-sm">
                    Loading...
                </div>
            </>
        );
    }

    // Detect Google-only accounts (no password provider)
    const isGoogleOnly = user.providerData.every(p => p.providerId !== "password");

    const handleResetPassword = async () => {
        setResetStatus("sending");
        try {
            await resetPassword(user.email);
            setResetStatus("sent");
        } catch {
            setResetStatus("error");
        }
    };

    const handleLogout = async () => {
        toast.success("Successfully logged out.");
        await handleSignOut();
        router.push("/");
    };

    return (
        <>
            <title>Settings | Kueru</title>
            <ConditionalNavbar />
            <main className="mx-auto w-full max-w-xl px-4 py-10">
                <h1 className="text-2xl font-bold mb-1">Settings</h1>
                <p className="text-sm text-muted-foreground mb-8">Manage your account</p>

                <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border">

                    {/* Activity */}
                    <SettingRow
                        icon={IconHistory}
                        iconColor="text-green-500"
                        label="Activity"
                        description="Your saved posts, recipes and upvote history"
                        onClick={() => router.push("/settings/activities")}
                    />

                    {/* Edit Profile */}
                    <SettingRow
                        icon={IconUser}
                        iconColor="text-primary"
                        label="Edit Profile"
                        description="Update your username, display name, bio and photo"
                        onClick={() => router.push("/profile/edit")}
                    />

                    {/* Edit Preferences */}
                    <SettingRow
                        icon={IconAdjustments}
                        iconColor="text-blue-500"
                        label="Edit Preferences"
                        description="Update your dietary needs, allergies, cooking level and cuisine interests"
                        onClick={() => router.push("/settings/preferences")}
                    />

                    {/* Reset Password */}
                    <SettingRow
                        icon={IconLock}
                        iconColor="text-amber-500"
                        label="Reset Password"
                        description={
                            isGoogleOnly
                                ? "Not available — you signed in with Google"
                                : resetStatus === "sent"
                                ? "Check your inbox for the reset link"
                                : resetStatus === "error"
                                ? "Something went wrong. Try again."
                                : `Send a reset link to ${user.email}`
                        }
                        onClick={!isGoogleOnly && resetStatus !== "sent" ? handleResetPassword : undefined}
                        disabled={isGoogleOnly || resetStatus === "sending" || resetStatus === "sent"}
                    >
                        {resetStatus === "sent" && (
                            <span className="flex items-center gap-1 mt-1 text-xs text-green-600 font-medium">
                                <IconCircleCheck className="size-3.5" /> Email sent
                            </span>
                        )}
                        {resetStatus === "error" && (
                            <span className="flex items-center gap-1 mt-1 text-xs text-destructive font-medium">
                                <IconAlertCircle className="size-3.5" /> Failed to send
                            </span>
                        )}
                    </SettingRow>

                </div>

                <Separator className="my-6" />

                {/* Log Out — separate, destructive */}
                <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 rounded-xl border border-destructive/30 px-4 py-4 text-left transition-colors hover:bg-destructive/5 cursor-pointer"
                >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <IconLogout className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-destructive">Log Out</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Sign out of your account</p>
                    </div>
                    <IconChevronRight className="size-4 text-destructive/60 shrink-0" />
                </button>
            </main>
        </>
    );
}
