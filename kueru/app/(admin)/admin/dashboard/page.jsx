"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/api/adminFetch";
import StatsCard from "../../_components/StatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    IconUsers,
    IconBook,
    IconMessage,
    IconShieldCheck,
    IconFlag,
    IconBolt,
    IconUserOff,
    IconEye,
} from "@tabler/icons-react";
import { STATUS_COLOR, TARGET_TYPE_COLOR } from "../../_lib/badgeColors";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(ts) {
    if (!ts) return "—";
    const seconds = ts._seconds ?? ts.seconds;
    if (!seconds) return "—";
    return new Date(seconds * 1000).toLocaleDateString("en-US", {
        day: "numeric", month: "short", year: "numeric",
    });
}

// ── Activity panel ────────────────────────────────────────────────────────────

function ActivityPanel({ title, emptyMessage, children }) {
    return (
        <Card className="flex flex-col">
            <CardContent className="p-5 flex flex-col gap-3 flex-1">
                <p className="text-sm font-semibold">{title}</p>
                {children ?? (
                    <p className="text-sm text-muted-foreground py-4 text-center">{emptyMessage}</p>
                )}
            </CardContent>
        </Card>
    );
}

function ActivityRow({ children }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-sm">
            {children}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminFetch("/api/admin/stats")
            .then((r) => r.json())
            .then((data) => { setStats(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const val = (key) => (loading ? "…" : (stats?.[key] ?? "—"));

    return (
        <div className="p-6 space-y-8">
            <div>
                <h1 className="mb-1 text-2xl font-bold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Platform overview</p>
            </div>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatsCard title="Total Users"            value={val("users")}               icon={IconUsers} />
                <StatsCard title="Total Recipes"          value={val("recipes")}             icon={IconBook} />
                <StatsCard title="Forum Posts"            value={val("posts")}               icon={IconMessage} />
                <StatsCard title="Active Challenges"      value={val("activeChallenges")}    icon={IconBolt} />
                <StatsCard
                    title="Pending Verifications"
                    value={val("pendingVerifications")}
                    icon={IconShieldCheck}
                    description="Awaiting review"
                />
                <StatsCard
                    title="Pending Reports"
                    value={val("pendingReports")}
                    icon={IconFlag}
                    description="Awaiting resolution"
                />
                <StatsCard
                    title="Disabled Users"
                    value={val("disabledUsers")}
                    icon={IconUserOff}
                    description="Currently restricted"
                />
            </div>

            {/* ── Activity panels ── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* Pending Reports */}
                <ActivityPanel
                    title="Pending Reports"
                    emptyMessage="No pending reports"
                >
                    {!loading && stats?.recentReports?.length > 0 && (
                        <div className="space-y-2">
                            {stats.recentReports.map((r) => (
                                <ActivityRow key={r.id}>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Badge
                                            variant="outline"
                                            className={`capitalize shrink-0 ${TARGET_TYPE_COLOR[r.targetType] ?? ""}`}
                                        >
                                            {r.targetType}
                                        </Badge>
                                        <div className="min-w-0">
                                            <p className="truncate font-medium text-xs">{r.reason}</p>
                                            <p className="text-xs text-muted-foreground">
                                                by {r.reporterUsername} · {formatDate(r.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1 shrink-0"
                                        onClick={() => router.push(`/admin/reports/${r.id}`)}
                                    >
                                        <IconEye className="size-3.5" />
                                        View
                                    </Button>
                                </ActivityRow>
                            ))}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-muted-foreground hover:text-foreground mt-1"
                                onClick={() => router.push("/admin/reports")}
                            >
                                View all reports →
                            </Button>
                        </div>
                    )}
                    {!loading && !stats?.recentReports?.length && null}
                </ActivityPanel>

                {/* Pending Verifications */}
                <ActivityPanel
                    title="Pending Verifications"
                    emptyMessage="No pending verifications"
                >
                    {!loading && stats?.recentVerifications?.length > 0 && (
                        <div className="space-y-2">
                            {stats.recentVerifications.map((v) => (
                                <ActivityRow key={v.id}>
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-xs">
                                            {v.username ?? v.userId}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] py-0 ${STATUS_COLOR[v.status] ?? ""}`}
                                            >
                                                {v.status?.replace("_", " ")}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(v.submittedAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1 shrink-0"
                                        onClick={() => router.push(`/admin/verifications/${v.verificationId ?? v.id}`)}
                                    >
                                        <IconEye className="size-3.5" />
                                        View
                                    </Button>
                                </ActivityRow>
                            ))}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-muted-foreground hover:text-foreground mt-1"
                                onClick={() => router.push("/admin/verifications")}
                            >
                                View all verifications →
                            </Button>
                        </div>
                    )}
                    {!loading && !stats?.recentVerifications?.length && null}
                </ActivityPanel>

            </div>
        </div>
    );
}
