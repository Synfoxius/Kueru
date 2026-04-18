"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllAchievements } from "@/lib/db/achievementService";
import DataTable from "../../_components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconEye } from "@tabler/icons-react";
import { CATEGORY_COLOR } from "../../_lib/badgeColors";

const TRACKING_LABELS = {
    streak:      "Streak",
    count:       "Count",
    exact_match: "Exact Match",
};

const columns = [
    { key: "title", label: "Title" },
    {
        key: "category",
        label: "Category",
        render: (row) => (
            <Badge variant="outline" className={CATEGORY_COLOR[row.category] ?? ""}>
                {row.category}
            </Badge>
        ),
    },
    {
        key: "trackingType",
        label: "Tracking",
        render: (row) => TRACKING_LABELS[row.trackingType] ?? row.trackingType ?? "—",
    },
    {
        key: "goalValue",
        label: "Goal",
        render: (row) =>
            row.goalValue != null
                ? `${row.goalValue}${row.unit ? ` ${row.unit}` : ""}`
                : "—",
    },
];

export default function AdminAchievementsPage() {
    const router = useRouter();
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAchievements = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllAchievements();
            setAchievements(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAchievements();
    }, [fetchAchievements]);

    const renderActions = (row) => (
        <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => router.push(`/admin/achievements/${row.id}`)}
        >
            <IconEye className="size-4" />
            Show Details
        </Button>
    );

    return (
        <div className="p-6">
            <h1 className="mb-1 text-2xl font-bold">Achievements</h1>
            <p className="mb-6 text-sm text-muted-foreground">
                {achievements.length} achievement{achievements.length !== 1 ? "s" : ""} total
            </p>
            <DataTable
                columns={columns}
                data={achievements}
                loading={loading}
                renderActions={renderActions}
                searchKeys={["title", "category"]}
                emptyMessage="No achievements found."
            />
        </div>
    );
}
