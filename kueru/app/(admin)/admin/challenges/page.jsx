"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllChallenges, createChallenge } from "@/lib/db/challengeService";
import { Timestamp } from "firebase/firestore";
import DataTable from "../../_components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { IconEye, IconPlus } from "@tabler/icons-react";
import { STATUS_COLOR, DIFFICULTY_COLOR } from "../../_lib/badgeColors";

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_LABELS = { individual: "Individual", collective: "Collective" };

const ICON_OPTIONS = [
    "heart", "world", "bolt", "flame", "star",
    "trophy", "leaf", "clock", "chef", "salad", "egg",
];

const CONDITION_TYPES = [
    { value: "none",                label: "None (any recipe qualifies)" },
    { value: "tag_includes",        label: "Tag Includes" },
    { value: "tag_includes_any",    label: "Tag Includes Any" },
    { value: "unique_cuisine_tags", label: "Unique Cuisine Tags" },
];

const EMPTY_FORM = {
    title: "", description: "",
    challengeType: "individual", difficulty: "easy",
    iconName: "trophy",
    startDate: "", endDate: "",
    goalValue: "",
    conditionType: "none", conditionValue: "", conditionValues: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(ts) {
    if (!ts) return "—";
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function buildCondition(form) {
    if (form.conditionType === "tag_includes")
        return { type: "tag_includes", value: form.conditionValue.trim() };
    if (form.conditionType === "tag_includes_any")
        return { type: "tag_includes_any", values: form.conditionValues.split(",").map((v) => v.trim()).filter(Boolean) };
    if (form.conditionType === "unique_cuisine_tags")
        return { type: "unique_cuisine_tags" };
    return null;
}

function buildPayload(form) {
    return {
        title: form.title.trim(),
        description: form.description.trim(),
        challengeType: form.challengeType,
        difficulty: form.difficulty,
        iconName: form.iconName,
        startDate: Timestamp.fromDate(new Date(form.startDate)),
        endDate: Timestamp.fromDate(new Date(form.endDate)),
        goalValue: Number(form.goalValue),
        condition: buildCondition(form),
    };
}

// ── Table columns ─────────────────────────────────────────────────────────────

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
    { key: "startDate", label: "Start", render: (row) => formatDate(row.startDate) },
    { key: "endDate",   label: "End",   render: (row) => formatDate(row.endDate) },
    {
        key: "participantCount",
        label: "Participants",
        render: (row) => (row.participantCount ?? 0).toLocaleString(),
    },
    {
        key: "progress",
        label: "Progress",
        render: (row) => row.goalValue != null ? `${row.currentValue ?? 0} / ${row.goalValue}` : "—",
    },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminChallengesPage() {
    const router = useRouter();
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);

    const fetchChallenges = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllChallenges();
            setChallenges(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchChallenges(); }, [fetchChallenges]);

    const set = (field) => (val) => setForm((prev) => ({ ...prev, [field]: val }));

    const handleCreate = async () => {
        setSaving(true);
        try {
            await createChallenge(buildPayload(form));
            setDialogOpen(false);
            setForm(EMPTY_FORM);
            fetchChallenges();
        } finally {
            setSaving(false);
        }
    };

    const today = new Date().toISOString().slice(0, 10);
    const canSubmit =
        form.title.trim() !== "" &&
        form.description.trim() !== "" &&
        form.startDate !== "" && form.startDate >= today &&
        form.endDate !== "" && form.endDate > form.startDate &&
        form.goalValue !== "" &&
        (form.conditionType !== "tag_includes" || form.conditionValue.trim() !== "") &&
        (form.conditionType !== "tag_includes_any" || form.conditionValues.trim() !== "");

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
                searchKeys={["title"]}
                emptyMessage="No challenges found."
                headerAction={
                    <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
                        <IconPlus className="size-4" />
                        Add Challenge
                    </Button>
                }
            />

            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setForm(EMPTY_FORM); }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Challenge</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Title</Label>
                            <Input value={form.title} onChange={(e) => set("title")(e.target.value)} placeholder="e.g. Meatless Meals" />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Description</Label>
                            <Textarea value={form.description} onChange={(e) => set("description")(e.target.value)} rows={2} placeholder="e.g. Cook 7 vegetarian meals this week" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Challenge Type</Label>
                                <Select value={form.challengeType} onValueChange={set("challengeType")}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="individual">Individual</SelectItem>
                                        <SelectItem value="collective">Collective</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Difficulty</Label>
                                <Select value={form.difficulty} onValueChange={set("difficulty")}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="easy">Easy</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="hard">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Icon</Label>
                            <Select value={form.iconName} onValueChange={set("iconName")}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {ICON_OPTIONS.map((name) => (
                                        <SelectItem key={name} value={name} className="capitalize">{name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Start Date</Label>
                                <Input type="date" min={today} value={form.startDate} onChange={(e) => set("startDate")(e.target.value)} />
                                {form.startDate && form.startDate < today && (
                                    <p className="text-xs text-destructive">Start date must be today or later.</p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label>End Date</Label>
                                <Input type="date" min={form.startDate || today} value={form.endDate} onChange={(e) => set("endDate")(e.target.value)} />
                                {form.endDate && form.startDate && form.endDate <= form.startDate && (
                                    <p className="text-xs text-destructive">End date must be after start date.</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Goal Value</Label>
                            <Input type="number" min={1} value={form.goalValue} onChange={(e) => set("goalValue")(e.target.value)} placeholder="7" />
                        </div>

                        <div className="space-y-3 rounded-md border border-border p-3">
                            <Label>Condition (optional)</Label>
                            <Select value={form.conditionType} onValueChange={set("conditionType")}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {CONDITION_TYPES.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.conditionType === "tag_includes" && (
                                <Input value={form.conditionValue} onChange={(e) => set("conditionValue")(e.target.value)} placeholder="e.g. Vegetarian" />
                            )}
                            {form.conditionType === "tag_includes_any" && (
                                <Input value={form.conditionValues} onChange={(e) => set("conditionValues")(e.target.value)} placeholder="e.g. Vegan, Vegetarian" />
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!canSubmit || saving}>
                            {saving ? "Creating..." : "Create Challenge"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
