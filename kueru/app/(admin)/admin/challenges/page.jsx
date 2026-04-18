"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllChallenges } from "@/lib/db/challengeService";
import DataTable from "../../_components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconEye } from "@tabler/icons-react";
import { STATUS_COLOR, DIFFICULTY_COLOR } from "../../_lib/badgeColors";

const TYPE_LABELS = {
    individual: "Individual",
    collective: "Collective",
};

function formatDate(ts) {
    if (!ts) return "—";
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

const columns = [
    { key: "title", label: "Title" },
    {
        key: "challengeType",
        label: "Type",
        render: (row) => TYPE_LABELS[row.challengeType] ?? row.challengeType ?? "—",
    },
    {
        key: "difficulty",
        label: "Difficulty",
        render: (row) => (
            <Badge variant="outline" className={`capitalize ${DIFFICULTY_COLOR[row.difficulty] ?? ""}`}>
                {row.difficulty ?? "—"}
            </Badge>
        ),
    },
    {
        key: "status",
        label: "Status",
        render: (row) => (
            <Badge variant="outline" className={`capitalize ${STATUS_COLOR[row.status] ?? ""}`}>
                {row.status ?? "—"}
            </Badge>
        ),
    },
    {
        key: "startDate",
        label: "Start",
        render: (row) => formatDate(row.startDate),
    },
    {
        key: "endDate",
        label: "End",
        render: (row) => formatDate(row.endDate),
    },
    {
        key: "participantCount",
        label: "Participants",
        render: (row) => (row.participantCount ?? 0).toLocaleString(),
    },
    {
        key: "progress",
        label: "Progress",
        render: (row) =>
            row.goalValue != null
                ? `${row.currentValue ?? 0} / ${row.goalValue}`
                : "—",
    },
];

export default function AdminChallengesPage() {
    const router = useRouter();
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchChallenges = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllChallenges();
            setChallenges(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchChallenges();
    }, [fetchChallenges]);

    const renderActions = (row) => (
        <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => router.push(`/admin/challenges/${row.id}`)}
        >
            <IconEye className="size-4" />
            Show Details
        </Button>
    );

    return (
        <div className="p-6">
            <h1 className="mb-1 text-2xl font-bold">Challenges</h1>
            <p className="mb-6 text-sm text-muted-foreground">
                {challenges.length} challenge{challenges.length !== 1 ? "s" : ""} total
            </p>
            <DataTable
                columns={columns}
                data={challenges}
                loading={loading}
                renderActions={renderActions}
                emptyMessage="No challenges found."
            />
        </div>
    );
}
