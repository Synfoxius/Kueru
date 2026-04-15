"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/api/adminFetch";
import StatsCard from "../../_components/StatsCard";
import {
    IconUsers,
    IconBook,
    IconMessage,
    IconShieldCheck,
} from "@tabler/icons-react";

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminFetch("/api/admin/stats")
            .then((r) => r.json())
            .then((data) => {
                setStats(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="p-6">
            <h1 className="mb-1 text-2xl font-bold">Dashboard</h1>
            <p className="mb-6 text-sm text-muted-foreground">
                Platform overview
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Users"
                    value={loading ? "…" : stats?.users}
                    icon={IconUsers}
                />
                <StatsCard
                    title="Total Recipes"
                    value={loading ? "…" : stats?.recipes}
                    icon={IconBook}
                />
                <StatsCard
                    title="Forum Posts"
                    value={loading ? "…" : stats?.posts}
                    icon={IconMessage}
                />
                <StatsCard
                    title="Pending Verifications"
                    value={loading ? "…" : stats?.pendingVerifications}
                    icon={IconShieldCheck}
                    description="Awaiting review"
                />
            </div>
        </div>
    );
}
