"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminFetch } from "@/lib/api/adminFetch";
import ConfirmDialog from "../../../_components/ConfirmDialog";
import DocumentPreview from "../../../_components/DocumentPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    IconArrowLeft,
    IconCheck,
    IconExternalLink,
    IconX,
} from "@tabler/icons-react";

const STATUS_VARIANT = {
    pending: "outline",
    under_review: "secondary",
    approved: "default",
    rejected: "destructive",
};

const ACTION_LABELS = {
    approved: "Approve Verification",
    rejected: "Reject Verification",
};

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

/** Labelled info row — omits itself when value is falsy */
function InfoRow({ label, value }) {
    if (!value) return null;
    return (
        <div className="flex gap-2 text-sm">
            <span className="w-40 shrink-0 font-medium text-muted-foreground">
                {label}
            </span>
            <span className="break-all">{value}</span>
        </div>
    );
}

/** Section heading */
function SectionHeading({ children }) {
    return (
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {children}
        </p>
    );
}

export default function VerificationDetailPage() {
    const { verificationId } = useParams();
    const router = useRouter();

    const [verification, setVerification] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // actionTarget: 'approved' | 'rejected' | null
    const [actionTarget, setActionTarget] = useState(null);
    const [note, setNote] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchVerification = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminFetch(`/api/admin/verifications/${verificationId}`);
            if (res.status === 404) {
                setNotFound(true);
                return;
            }
            const data = await res.json();
            setVerification(data.verification ?? null);
        } finally {
            setLoading(false);
        }
    }, [verificationId]);

    useEffect(() => {
        fetchVerification();
    }, [fetchVerification]);

    const handleAction = async () => {
        if (!actionTarget) return;
        setActionLoading(true);
        try {
            await adminFetch(`/api/admin/verifications/${verificationId}`, {
                method: "PATCH",
                body: JSON.stringify({ status: actionTarget, note }),
            });
            router.push("/admin/verifications");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (notFound || !verification) {
        return (
            <div className="p-6">
                <p className="text-sm text-muted-foreground">Verification request not found.</p>
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-1.5"
                    onClick={() => router.push("/admin/verifications")}
                >
                    <IconArrowLeft className="size-4" /> Back to list
                </Button>
            </div>
        );
    }

    const v = verification;
    const isActionable = v.status === "pending" || v.status === "under_review";

    return (
        <div className="p-6 max-w-3xl">
            {/* Page header */}
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.push("/admin/verifications")}
                        className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <IconArrowLeft className="size-4" /> Back to list
                    </button>
                    <h1 className="text-2xl font-bold">Verification Request</h1>
                </div>
                <Badge
                    variant={STATUS_VARIANT[v.status] ?? "outline"}
                    className="text-sm px-3 py-1"
                >
                    {v.status.replace("_", " ")}
                </Badge>
            </div>

            <div className="space-y-4">
                {/* Submission meta */}
                <Card>
                    <CardContent className="p-5 space-y-1.5">
                        <SectionHeading>Submission</SectionHeading>
                        <InfoRow label="User ID" value={v.userId} />
                        <InfoRow label="Submitted" value={formatDate(v.submittedAt)} />
                        {v.reviewedAt && (
                            <InfoRow label="Reviewed" value={formatDate(v.reviewedAt)} />
                        )}
                        {v.reviewedBy && (
                            <InfoRow label="Reviewed by" value={v.reviewedBy} />
                        )}
                        {v.status === "rejected" && v.rejectionReason && (
                            <div className="mt-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                <span className="font-semibold">Rejection reason: </span>
                                {v.rejectionReason}
                            </div>
                        )}
                        {v.status === "approved" && v.notes && (
                            <div className="mt-2 rounded-md bg-muted px-3 py-2 text-sm">
                                <span className="font-semibold">Notes: </span>
                                {v.notes}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Professional information */}
                {v.professional && (
                    <Card>
                        <CardContent className="p-5 space-y-1.5">
                            <SectionHeading>Professional Information</SectionHeading>
                            <InfoRow label="Full name"   value={v.professional.legalName} />
                            <InfoRow label="Workplace"   value={v.professional.workplace} />
                            <InfoRow label="Job title"   value={v.professional.jobTitle} />
                            <InfoRow
                                label="Experience"
                                value={
                                    v.professional.yearsExp
                                        ? `${v.professional.yearsExp} years`
                                        : null
                                }
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Education & credentials */}
                {v.education &&
                    (v.education.culinarySchool ||
                        v.education.gradYear ||
                        v.education.certifications) && (
                        <Card>
                            <CardContent className="p-5 space-y-1.5">
                                <SectionHeading>Education &amp; Credentials</SectionHeading>
                                <InfoRow label="Culinary school"  value={v.education.culinarySchool} />
                                <InfoRow label="Graduation year"  value={v.education.gradYear} />
                                <InfoRow label="Certifications"   value={v.education.certifications} />
                            </CardContent>
                        </Card>
                    )}

                {/* Professional links */}
                {v.links &&
                    (v.links.website || v.links.linkedin || v.links.instagram) && (
                        <Card>
                            <CardContent className="p-5 space-y-1.5">
                                <SectionHeading>Professional Links</SectionHeading>
                                {v.links.website && (
                                    <div className="flex gap-2 text-sm items-center">
                                        <span className="w-40 shrink-0 font-medium text-muted-foreground">
                                            Website
                                        </span>
                                        <a
                                            href={v.links.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-primary hover:underline"
                                        >
                                            {v.links.website}
                                            <IconExternalLink className="size-3" />
                                        </a>
                                    </div>
                                )}
                                {v.links.linkedin && (
                                    <div className="flex gap-2 text-sm items-center">
                                        <span className="w-40 shrink-0 font-medium text-muted-foreground">
                                            LinkedIn
                                        </span>
                                        <a
                                            href={v.links.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-primary hover:underline"
                                        >
                                            {v.links.linkedin}
                                            <IconExternalLink className="size-3" />
                                        </a>
                                    </div>
                                )}
                                <InfoRow label="Instagram" value={v.links.instagram} />
                            </CardContent>
                        </Card>
                    )}

                {/* Supporting documents */}
                <Card>
                    <CardContent className="p-5 space-y-3">
                        <SectionHeading>
                            Supporting Documents ({v.documents?.length ?? 0})
                        </SectionHeading>
                        {v.documents?.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {v.documents.map((docItem, i) => {
                                    const url =
                                        typeof docItem === "string"
                                            ? docItem
                                            : docItem?.url;
                                    return (
                                        <DocumentPreview key={i} url={url} index={i} />
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No documents uploaded.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Additional information */}
                {v.additionalInfo && (
                    <Card>
                        <CardContent className="p-5 space-y-1.5">
                            <SectionHeading>Additional Information</SectionHeading>
                            <p className="text-sm">{v.additionalInfo}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Actions — only shown for pending / under_review */}
                {isActionable && (
                    <div className="flex gap-2 pt-2">
                        <Button
                            onClick={() => {
                                setNote("");
                                setActionTarget("approved");
                            }}
                            className="gap-1.5"
                        >
                            <IconCheck className="size-4" /> Approve
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                setNote("");
                                setActionTarget("rejected");
                            }}
                            className="gap-1.5"
                        >
                            <IconX className="size-4" /> Reject
                        </Button>
                    </div>
                )}
            </div>

            {/* Confirmation dialog */}
            <ConfirmDialog
                open={!!actionTarget}
                onOpenChange={(open) => {
                    if (!open) {
                        setActionTarget(null);
                        setNote("");
                    }
                }}
                title={ACTION_LABELS[actionTarget] ?? "Confirm Action"}
                description={
                    actionTarget === "rejected"
                        ? "Please provide a rejection reason that will be shared with the applicant."
                        : "Optionally add an internal note for this action."
                }
                confirmLabel="Confirm"
                onConfirm={handleAction}
                loading={actionLoading}
                variant={actionTarget === "rejected" ? "destructive" : "default"}
            >
                <div className="space-y-1.5">
                    <Label htmlFor="action-note">
                        {actionTarget === "rejected"
                            ? "Rejection Reason"
                            : "Note (optional)"}
                    </Label>
                    <Input
                        id="action-note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={
                            actionTarget === "rejected"
                                ? "Enter rejection reason…"
                                : "Internal note…"
                        }
                    />
                </div>
            </ConfirmDialog>
        </div>
    );
}
