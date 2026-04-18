"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/api/adminFetch";
import DataTable from "../../_components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IconEye } from "@tabler/icons-react";
import { STATUS_COLOR } from "../../_lib/badgeColors";

const FILTERS = [
    { value: "all",          label: "All" },
    { value: "pending",      label: "Pending" },
    { value: "under_review", label: "Under Review" },
    { value: "approved",     label: "Approved" },
    { value: "rejected",     label: "Rejected" },
];

function formatDate(ts) {
    if (!ts) return "—";
    const seconds = ts._seconds ?? ts.seconds;
    return seconds ? new Date(seconds * 1000).toLocaleDateString() : "—";
}

const columns = [
    {
        key: "userId",
        label: "User ID",
        render: (row) => (
            <span className="font-mono text-xs">{row.userId}</span>
        ),
    },
    {
        key: "submittedAt",
        label: "Submitted",
        render: (row) => formatDate(row.submittedAt),
    },
    {
        key: "status",
        label: "Status",
        render: (row) => (
            <Badge variant="outline" className={STATUS_COLOR[row.status] ?? ""}>
                {row.status.replace("_", " ")}
            </Badge>
        ),
    },
];

export default function VerificationsPage() {
    const router = useRouter();
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("all");

    const fetchVerifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminFetch("/api/admin/verifications");
            const data = await res.json();
            setVerifications(data.verifications ?? []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVerifications();
    }, [fetchVerifications]);

    const counts = useMemo(() => {
        const c = { all: verifications.length, pending: 0, under_review: 0, approved: 0, rejected: 0 };
        verifications.forEach((v) => { if (v.status in c) c[v.status]++; });
        return c;
    }, [verifications]);

    const filtered = useMemo(
        () =>
            activeFilter === "all"
                ? verifications
                : verifications.filter((v) => v.status === activeFilter),
        [verifications, activeFilter]
    );

    const tableData = useMemo(
        () => filtered.map((v) => ({ ...v, id: v.verificationId })),
        [filtered]
    );

    const renderActions = (row) => (
        <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => router.push(`/admin/verifications/${row.verificationId}`)}
        >
            <IconEye className="size-4" />
            Show Details
        </Button>
    );

    return (
        <div className="p-6">
            <h1 className="mb-1 text-2xl font-bold">Chef Verifications</h1>
            <p className="mb-6 text-sm text-muted-foreground">
                {verifications.length} total request{verifications.length !== 1 ? "s" : ""}
            </p>

            <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setActiveFilter(f.value)}
                        className={cn(
                            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                            activeFilter === f.value
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {f.label}
                        <span className="ml-1.5 text-xs opacity-60">{counts[f.value]}</span>
                    </button>
                ))}
            </div>

            <DataTable
                columns={columns}
                data={tableData}
                loading={loading}
                renderActions={renderActions}
                searchKeys={["userId"]}
                emptyMessage="No verification requests found."
            />
        </div>
    );
}
