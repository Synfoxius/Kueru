"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminFetch } from "@/lib/api/adminFetch";
import DataTable from "../../_components/DataTable";
import ConfirmDialog from "../../_components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconChevronDown, IconTrash } from "@tabler/icons-react";
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
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

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

    const handleRoleChange = async (userId, role) => {
        await adminFetch(`/api/admin/users/${userId}`, {
            method: "PATCH",
            body: JSON.stringify({ role }),
        });
        setUsers((prev) =>
            prev.map((u) => (u.userId === userId ? { ...u, role } : u))
        );
    };

    const handleStatusChange = async (userId, status) => {
        await adminFetch(`/api/admin/users/${userId}`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
        });
        setUsers((prev) =>
            prev.map((u) => (u.userId === userId ? { ...u, status } : u))
        );
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await adminFetch(`/api/admin/users/${deleteTarget.userId}`, {
                method: "DELETE",
            });
            setUsers((prev) => prev.filter((u) => u.userId !== deleteTarget.userId));
            setDeleteTarget(null);
        } finally {
            setDeleteLoading(false);
        }
    };

    const renderActions = (row) => {
        const isSelf = row.userId === currentUser?.uid;
        const currentStatus = row.status ?? "active";
        return (
        <div className="flex items-center justify-end gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1" disabled={isSelf}>
                        Role <IconChevronDown className="size-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {["admin", "chef", "customer"].map((role) => (
                        <DropdownMenuItem
                            key={role}
                            onClick={() => handleRoleChange(row.userId, role)}
                            disabled={row.role === role}
                        >
                            Set {role}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1" disabled={isSelf}>
                        Status <IconChevronDown className="size-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {["active", "disabled"].map((status) => (
                        <DropdownMenuItem
                            key={status}
                            onClick={() => handleStatusChange(row.userId, status)}
                            disabled={currentStatus === status}
                            className="capitalize"
                        >
                            Set {status}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteTarget(row)}
                disabled={isSelf}
            >
                <IconTrash className="size-4" />
                Delete
            </Button>
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
            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete User"
                description={`Are you sure you want to permanently delete @${deleteTarget?.username}? This cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={handleDelete}
                loading={deleteLoading}
            />
        </div>
    );
}
