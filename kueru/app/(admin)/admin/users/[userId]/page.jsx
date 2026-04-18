"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminFetch } from "@/lib/api/adminFetch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    IconArrowLeft,
    IconChevronDown,
    IconShieldCheck,
} from "@tabler/icons-react";
import { ROLE_COLOR, STATUS_COLOR } from "../../../_lib/badgeColors";

function formatDate(ts) {
    if (!ts) return "—";
    const seconds = ts._seconds ?? ts.seconds;
    return seconds
        ? new Date(seconds * 1000).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
          })
        : "—";
}

function InfoRow({ label, value }) {
    if (!value && value !== 0) return null;
    return (
        <div className="flex gap-2 text-sm">
            <span className="w-44 shrink-0 font-medium text-muted-foreground">{label}</span>
            <span className="break-all">{value}</span>
        </div>
    );
}

function SectionHeading({ children }) {
    return (
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {children}
        </p>
    );
}

export default function UserDetailPage() {
    const { userId } = useParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();

    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [roleLoading, setRoleLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);

    const fetchUser = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminFetch(`/api/admin/users/${userId}`);
            if (res.status === 404) { setNotFound(true); return; }
            const data = await res.json();
            setUserData(data.user ?? null);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { fetchUser(); }, [fetchUser]);

    const handleRoleChange = async (role) => {
        setRoleLoading(true);
        try {
            await adminFetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                body: JSON.stringify({ role }),
            });
            setUserData((prev) => ({ ...prev, role }));
        } finally {
            setRoleLoading(false);
        }
    };

    const handleStatusToggle = async () => {
        const newStatus = (userData?.status ?? "active") === "active" ? "disabled" : "active";
        setStatusLoading(true);
        try {
            await adminFetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
            });
            setUserData((prev) => ({ ...prev, status: newStatus }));
        } finally {
            setStatusLoading(false);
        }
    };

    if (loading) {
        return <div className="p-6"><p className="text-sm text-muted-foreground">Loading...</p></div>;
    }

    if (notFound || !userData) {
        return (
            <div className="p-6">
                <p className="text-sm text-muted-foreground">User not found.</p>
                <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => router.push("/admin/users")}>
                    <IconArrowLeft className="size-4" /> Back to list
                </Button>
            </div>
        );
    }

    const u = userData;
    const isSelf = u.userId === currentUser?.uid;
    const currentStatus = u.status ?? "active";
    const isDisabled = currentStatus === "disabled";

    return (
        <div className="p-6 max-w-3xl">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => router.push("/admin/users")}
                    className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <IconArrowLeft className="size-4" /> Back to list
                </button>
                <div className="flex items-start gap-4">
                    <Avatar className="size-16">
                        <AvatarImage src={u.profileImage} />
                        <AvatarFallback className="text-lg">
                            {u.username?.[0]?.toUpperCase() ?? "?"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-bold">{u.username ?? u.userId}</h1>
                            {u.verified && (
                                <IconShieldCheck className="size-5 text-blue-500 shrink-0" />
                            )}
                        </div>
                        {u.displayName && u.displayName !== u.username && (
                            <p className="text-sm text-muted-foreground">{u.displayName}</p>
                        )}
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`capitalize ${ROLE_COLOR[u.role] ?? ""}`}>
                                {u.role ?? "—"}
                            </Badge>
                            <Badge variant="outline" className={`capitalize ${STATUS_COLOR[currentStatus] ?? ""}`}>
                                {currentStatus}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {/* Account info */}
                <Card>
                    <CardContent className="p-5 space-y-1.5">
                        <SectionHeading>Account</SectionHeading>
                        <InfoRow label="User ID" value={u.userId} />
                        <InfoRow label="Email" value={u.email} />
                        <InfoRow label="Username" value={u.username} />
                        <InfoRow label="Display name" value={u.displayName} />
                        <InfoRow label="Joined" value={formatDate(u.createdAt)} />
                        <InfoRow label="Followers" value={u.followerCount ?? 0} />
                        <InfoRow label="Following" value={u.followingCount ?? 0} />
                        {u.bio && (
                            <>
                                <Separator className="my-2" />
                                <div className="text-sm">
                                    <span className="font-medium text-muted-foreground">Bio</span>
                                    <p className="mt-1">{u.bio}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Onboarding preferences */}
                {(u.cookingSkill || u.dietaryPreferences?.length || u.foodAllergies?.length || u.recipeInterests?.length) && (
                    <Card>
                        <CardContent className="p-5 space-y-2">
                            <SectionHeading>Onboarding Preferences</SectionHeading>
                            <InfoRow label="Cooking skill" value={u.cookingSkill} />
                            {u.dietaryPreferences?.length > 0 && (
                                <div className="flex gap-2 text-sm">
                                    <span className="w-44 shrink-0 font-medium text-muted-foreground">Dietary</span>
                                    <div className="flex flex-wrap gap-1">
                                        {u.dietaryPreferences.map((p) => (
                                            <Badge key={p} variant="outline" className="text-xs capitalize">{p}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {u.foodAllergies?.length > 0 && (
                                <div className="flex gap-2 text-sm">
                                    <span className="w-44 shrink-0 font-medium text-muted-foreground">Allergies</span>
                                    <div className="flex flex-wrap gap-1">
                                        {u.foodAllergies.map((a) => (
                                            <Badge key={a} variant="outline" className="text-xs capitalize">{a}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {u.recipeInterests?.length > 0 && (
                                <div className="flex gap-2 text-sm">
                                    <span className="w-44 shrink-0 font-medium text-muted-foreground">Interests</span>
                                    <div className="flex flex-wrap gap-1">
                                        {u.recipeInterests.map((i) => (
                                            <Badge key={i} variant="outline" className="text-xs capitalize">{i}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                {!isSelf && (
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1" disabled={roleLoading}>
                                    Change Role <IconChevronDown className="size-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                {["admin", "chef", "customer"].map((role) => (
                                    <DropdownMenuItem
                                        key={role}
                                        onClick={() => handleRoleChange(role)}
                                        disabled={u.role === role}
                                        className="capitalize"
                                    >
                                        Set {role}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="outline"
                            size="sm"
                            className={isDisabled
                                ? "gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
                                : "gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
                            }
                            onClick={handleStatusToggle}
                            disabled={statusLoading}
                        >
                            {isDisabled ? "Enable Account" : "Mark as Disabled"}
                        </Button>

                    </div>
                )}
            </div>
        </div>
    );
}
