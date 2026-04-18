"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/api/adminFetch";
import DataTable from "../../_components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconEye, IconTrash, IconCircleCheck } from "@tabler/icons-react";
import { ROLE_COLOR, STATUS_COLOR } from "../../_lib/badgeColors";

function formatDate(ts) {
    if (!ts) return "—";
    const seconds = ts._seconds ?? ts.seconds;
    return seconds ? new Date(seconds * 1000).toLocaleDateString() : "—";
}

const columns = [
    { key: "username", label: "Username" },
    { key: "email", label: "Email" },
    {
        key: "role",
        label: "Role",
        render: (row) => (
            <Badge variant="outline" className={ROLE_COLOR[row.role] ?? ""}>{row.role}</Badge>
        ),
    },
    {
        key: "status",
        label: "Status",
        render: (row) => {
            const status = row.status ?? "active";
            return (
                <Badge variant="outline" className={`capitalize ${STATUS_COLOR[status] ?? ""}`}>
                    {status}
                </Badge>
            );
        },
    },
    {
        key: "verified",
        label: "Verified",
        render: (row) => (
            <Badge variant="outline" className={row.verified ? STATUS_COLOR.active : "bg-slate-100 text-slate-600 border-slate-200"}>
                {row.verified ? "Yes" : "No"}
            </Badge>
        ),
    },
    {
        key: "createdAt",
        label: "Joined",
        render: (row) => formatDate(row.createdAt),
    },
];

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminFetch("/api/admin/users");
            const data = await res.json();
            setUsers(data.users ?? []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleStatusChange = async (userId, status) => {
        await adminFetch(`/api/admin/users/${userId}`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
        });
        setUsers((prev) =>
            prev.map((u) => (u.userId === userId ? { ...u, status } : u))
        );
    };

    const renderActions = (row) => {
        const isSelf = row.userId === currentUser?.uid;
        const currentStatus = row.status ?? "active";
        const isDisabled = currentStatus === "disabled";
        return (
            <div className="flex items-center justify-end gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => router.push(`/admin/users/${row.userId}`)}
                >
                    <IconEye className="size-4" /> Show Details
                </Button>
                {!isSelf && (
                    <Button
                        variant="ghost"
                        size="sm"
                        title={isDisabled ? "Enable user" : "Disable user"}
                        className={isDisabled
                            ? "text-green-600 hover:bg-green-50 hover:text-green-700"
                            : "text-destructive hover:bg-destructive/10 hover:text-destructive"
                        }
                        onClick={() => handleStatusChange(row.userId, isDisabled ? "active" : "disabled")}
                    >
                        {isDisabled
                            ? <IconCircleCheck className="size-4" />
                            : <IconTrash className="size-4" />
                        }
                    </Button>
                )}
            </div>
        );
    };

    return (
        <div className="p-6">
            <h1 className="mb-1 text-2xl font-bold">Users</h1>
            <p className="mb-6 text-sm text-muted-foreground">
                {users.length} user{users.length !== 1 ? "s" : ""} total
            </p>
            <DataTable
                columns={columns}
                data={users}
                loading={loading}
                renderActions={renderActions}
                emptyMessage="No users found."
            />
        </div>
    );
}
