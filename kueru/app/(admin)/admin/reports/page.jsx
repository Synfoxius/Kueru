"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/api/adminFetch";
import DataTable from "../../_components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IconEye } from "@tabler/icons-react";
import { STATUS_COLOR, TARGET_TYPE_COLOR } from "../../_lib/badgeColors";

const FILTERS = [
    { value: "all",      label: "All" },
    { value: "pending",  label: "Pending" },
    { value: "resolved", label: "Resolved" },
];

function targetLink(targetType, targetId) {
    switch (targetType) {
        case "recipe":  return `/recipes/${targetId}`;
        case "post":    return `/forum/${targetId}`;
        default:        return null;
    }
}

function formatDate(ts) {
    if (!ts) return "—";
    const seconds = ts._seconds ?? ts.seconds;
    return seconds
        ? new Date(seconds * 1000).toLocaleDateString("en-US", {
              day: "numeric", month: "short", year: "numeric",
          })
        : "—";
}

const columns = [
    {
        key: "target",
        label: "Target",
        render: (row) => {
            const href = targetLink(row.targetType, row.targetId);
            const label = row.targetName ?? row.targetId;
            return (
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`capitalize shrink-0 ${TARGET_TYPE_COLOR[row.targetType] ?? ""}`}>
                        {row.targetType ?? "—"}
                    </Badge>
                    {href ? (
                        <Link
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary underline underline-offset-2 hover:opacity-80 truncate max-w-48"
                        >
                            {label}
                        </Link>
                    ) : (
                        <span className="text-sm truncate max-w-48">{label}</span>
                    )}
                </div>
            );
        },
    },
    { key: "reason", label: "Reason" },
    {
        key: "details",
        label: "Details",
        render: (row) =>
            row.details ? (
                <span className="block max-w-48 truncate text-muted-foreground text-sm" title={row.details}>
                    {row.details}
                </span>
            ) : (
                <span className="text-muted-foreground">—</span>
            ),
    },
    {
        key: "reporterUsername",
        label: "Reported By",
        render: (row) => row.reporterUsername ?? "—",
    },
    {
        key: "createdAt",
        label: "Submitted",
        render: (row) => formatDate(row.createdAt),
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
];

export default function ReportsPage() {
    const router = useRouter();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("pending");

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminFetch("/api/admin/reports");
            const data = await res.json();
            setReports(data.reports ?? []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const counts = useMemo(() => {
        const c = { all: reports.length, pending: 0, resolved: 0 };
        reports.forEach((r) => { if (r.status in c) c[r.status]++; });
        return c;
    }, [reports]);

    const filtered = useMemo(
        () =>
            activeFilter === "all"
                ? reports
                : reports.filter((r) => r.status === activeFilter),
        [reports, activeFilter]
    );

    const renderActions = (row) => (
        <div className="flex items-center justify-end gap-2">
            <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => router.push(`/admin/reports/${row.id}`)}
            >
                <IconEye className="size-4" />
                Show Details
            </Button>
        </div>
    );

    return (
        <div className="p-6">
            <h1 className="mb-1 text-2xl font-bold">Reports</h1>
            <p className="mb-6 text-sm text-muted-foreground">
                {counts.pending} pending report{counts.pending !== 1 ? "s" : ""}
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
                        <span className="ml-1.5 text-xs opacity-60">{counts[f.value] ?? 0}</span>
                    </button>
                ))}
            </div>

            <DataTable
                columns={columns}
                data={filtered}
                loading={loading}
                renderActions={renderActions}
                emptyMessage="No reports found."
            />
        </div>
    );
}
