"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const REASONS = [
    "Spam",
    "Harassment",
    "Misinformation",
    "Off-topic",
    "Other",
];

/**
 * Report dialog with predefined reasons + optional details.
 *
 * Props:
 *   open        boolean
 *   onCancel    () => void
 *   onSubmit    (reason: string, details: string | null) => Promise<void>
 */
export default function ReportDialog({ open, onCancel, onSubmit, title = "Report post", description = "Help us understand what's wrong with this post." }) {
    const [reason, setReason] = useState(null);
    const [details, setDetails] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!reason) { return; }
        setSubmitting(true);
        try {
            await onSubmit(reason, details.trim() || null);
        } finally {
            setSubmitting(false);
            setReason(null);
            setDetails("");
        }
    };

    const handleCancel = () => {
        setReason(null);
        setDetails("");
        onCancel();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) { handleCancel(); } }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-2">
                    <div className="flex flex-col gap-2">
                        <Label className="text-sm font-medium">Reason</Label>
                        <div className="flex flex-col gap-1.5">
                            {REASONS.map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setReason(r)}
                                    className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm text-left transition-colors ${
                                        reason === r
                                            ? "border-primary bg-primary/5 text-primary font-medium"
                                            : "border-input bg-background text-foreground hover:border-primary/50"
                                    }`}
                                >
                                    <span className={`size-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                                        reason === r ? "border-primary" : "border-muted-foreground/40"
                                    }`}>
                                        {reason === r && (
                                            <span className="size-2 rounded-full bg-primary" />
                                        )}
                                    </span>
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {reason && (
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-sm font-medium">
                                Additional details <span className="text-muted-foreground font-normal">(optional)</span>
                            </Label>
                            <textarea
                                placeholder="Provide any additional context..."
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-colors"
                            />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={!reason || submitting}
                    >
                        {submitting ? "Submitting..." : "Submit Report"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
