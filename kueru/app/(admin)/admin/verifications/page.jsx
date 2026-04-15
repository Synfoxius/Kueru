"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/api/adminFetch";
import ConfirmDialog from "../../_components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { IconCheck, IconClock, IconX } from "@tabler/icons-react";

const STATUS_VARIANT = {
    pending: "outline",
    under_review: "secondary",
    approved: "default",
    rejected: "destructive",
};

const ACTION_LABELS = {
    approved: "Approve Verification",
    rejected: "Reject Verification",
    under_review: "Mark as Under Review",
};

function formatDate(ts) {
    if (!ts) return "—";
    const seconds = ts._seconds ?? ts.seconds;
    return seconds ? new Date(seconds * 1000).toLocaleDateString() : "—";
}

export default function VerificationsPage() {
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    // actionTarget: { verification, action: 'approved'|'rejected'|'under_review' }
    const [actionTarget, setActionTarget] = useState(null);
    const [note, setNote] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

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

    const openAction = (verification, action) => {
        setNote("");
        setActionTarget({ verification, action });
    };

    const handleAction = async () => {
        if (!actionTarget) return;
        setActionLoading(true);
        try {
            await adminFetch(
                `/api/admin/verifications/${actionTarget.verification.verificationId}`,
                {
                    method: "PATCH",
                    body: JSON.stringify({ status: actionTarget.action, note }),
                }
            );
            // Remove from list after any action (all result in a status change)
            setVerifications((prev) =>
                prev.filter(
                    (v) =>
                        v.verificationId !==
                        actionTarget.verification.verificationId
                )
            );
            setActionTarget(null);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <h1 className="mb-6 text-2xl font-bold">Chef Verifications</h1>
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="mb-1 text-2xl font-bold">Chef Verifications</h1>
            <p className="mb-6 text-sm text-muted-foreground">
                {verifications.length} pending review
            </p>

            {verifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No pending verifications.
                </p>
            ) : (
                <div className="grid gap-4">
                    {verifications.map((v) => (
                        <Card key={v.verificationId}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-semibold">
                                            User ID:{" "}
                                            <span className="font-mono text-xs">
                                                {v.userId}
                                            </span>
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            Submitted: {formatDate(v.submittedAt)}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={
                                            STATUS_VARIANT[v.status] ?? "outline"
                                        }
                                    >
                                        {v.status}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                {/* Uploaded documents */}
                                <div>
                                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                                        Documents ({v.documents?.length ?? 0})
                                    </p>
                                    {v.documents?.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {v.documents.map((docItem, i) => (
                                                <a
                                                    key={i}
                                                    href={docItem.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:underline"
                                                >
                                                    {docItem.type}:{" "}
                                                    {docItem.filename}
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">
                                            No documents uploaded.
                                        </p>
                                    )}
                                </div>

                                <Separator />

                                {/* Action buttons */}
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            openAction(v, "approved")
                                        }
                                        className="gap-1.5"
                                    >
                                        <IconCheck className="size-3.5" />
                                        Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            openAction(v, "under_review")
                                        }
                                        className="gap-1.5"
                                    >
                                        <IconClock className="size-3.5" />
                                        Under Review
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() =>
                                            openAction(v, "rejected")
                                        }
                                        className="gap-1.5"
                                    >
                                        <IconX className="size-3.5" />
                                        Reject
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Action confirmation dialog */}
            <ConfirmDialog
                open={!!actionTarget}
                onOpenChange={(open) => {
                    if (!open) {
                        setActionTarget(null);
                        setNote("");
                    }
                }}
                title={ACTION_LABELS[actionTarget?.action] ?? "Confirm Action"}
                description={
                    actionTarget?.action === "rejected"
                        ? "Please provide a rejection reason that will be shared with the applicant."
                        : "Optionally add an internal note for this action."
                }
                confirmLabel="Confirm"
                onConfirm={handleAction}
                loading={actionLoading}
                variant={
                    actionTarget?.action === "rejected"
                        ? "destructive"
                        : "default"
                }
            >
                <div className="space-y-1.5">
                    <Label htmlFor="action-note">
                        {actionTarget?.action === "rejected"
                            ? "Rejection Reason"
                            : "Note (optional)"}
                    </Label>
                    <Input
                        id="action-note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={
                            actionTarget?.action === "rejected"
                                ? "Enter rejection reason…"
                                : "Internal note…"
                        }
                    />
                </div>
            </ConfirmDialog>
        </div>
    );
}
