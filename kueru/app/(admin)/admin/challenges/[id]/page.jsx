"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getChallengeById, updateChallenge } from "@/lib/db/challengeService";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    IconArrowLeft, IconPencil,
    IconHeart, IconWorld, IconBolt, IconFlame, IconStar,
    IconTrophy, IconLeaf, IconEgg, IconChefHat, IconSalad,
    IconUsers, IconClock,
} from "@tabler/icons-react";
import ParticipantsTab from "@/app/challenges/[id]/_components/ParticipantsTab";
import ViewPostsTab from "@/app/challenges/[id]/_components/ViewPostsTab";

// ── Constants ─────────────────────────────────────────────────────────────────

const ICON_MAP = {
    heart: IconHeart, world: IconWorld, bolt: IconBolt, flame: IconFlame,
    star: IconStar, trophy: IconTrophy, leaf: IconLeaf, egg: IconEgg,
    chef: IconChefHat, salad: IconSalad,
};

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

const DIFFICULTY_VARIANT = { easy: "secondary", medium: "outline", hard: "destructive" };
const STATUS_VARIANT     = { active: "default", expired: "outline" };
const TYPE_LABELS        = { individual: "Individual", collective: "Collective" };

const TABS = [
    { key: "participants", label: "Participants" },
    { key: "posts",        label: "Community Posts" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function ChallengeIcon({ iconName, className }) {
    const Icon = ICON_MAP[iconName] ?? IconTrophy;
    return <Icon className={className} />;
}

function formatDate(ts) {
    if (!ts) return "—";
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateRange(challenge) {
    return `${formatDate(challenge.startDate)} – ${formatDate(challenge.endDate)}`;
}

function daysRemaining(challenge) {
    const end = challenge.endDate?.toDate?.() ?? new Date(challenge.endDate);
    const diff = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
    if (diff <= 0) return null;
    return diff === 1 ? "1 day remaining" : `${diff} days remaining`;
}

function toDateStr(ts) {
    if (!ts) return "";
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toISOString().slice(0, 10);
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

function challengeToForm(c) {
    let conditionType = "none", conditionValue = "", conditionValues = "";
    if (c.condition?.type === "tag_includes") {
        conditionType = "tag_includes"; conditionValue = c.condition.value ?? "";
    } else if (c.condition?.type === "tag_includes_any") {
        conditionType = "tag_includes_any"; conditionValues = (c.condition.values ?? []).join(", ");
    } else if (c.condition?.type === "unique_cuisine_tags") {
        conditionType = "unique_cuisine_tags";
    }
    return {
        title: c.title ?? "", description: c.description ?? "",
        challengeType: c.challengeType ?? "individual", difficulty: c.difficulty ?? "easy",
        iconName: c.iconName ?? "trophy",
        startDate: toDateStr(c.startDate), endDate: toDateStr(c.endDate),
        goalValue: c.goalValue != null ? String(c.goalValue) : "",
        status: c.status ?? "active",
        conditionType, conditionValue, conditionValues,
    };
}

function SectionHeading({ children }) {
    return <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</p>;
}

function InfoRow({ label, value }) {
    if (value == null || value === "") return null;
    return (
        <div className="flex gap-2 text-sm">
            <span className="w-40 shrink-0 font-medium text-muted-foreground">{label}</span>
            <span className="break-all">{value}</span>
        </div>
    );
}

function TabBar({ active, onChange }) {
    return (
        <div className="flex gap-2 mb-6">
            {TABS.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onChange(tab.key)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors border ${
                        active === tab.key
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-white text-foreground border-border hover:bg-muted"
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminChallengeDetailPage() {
    const { id: challengeId } = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [activeTab, setActiveTab] = useState("participants");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(null);

    const fetchChallenge = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getChallengeById(challengeId);
            if (!data) { setNotFound(true); return; }
            setChallenge(data);
        } finally {
            setLoading(false);
        }
    }, [challengeId]);

    useEffect(() => { fetchChallenge(); }, [fetchChallenge]);

    const openEdit = () => {
        setForm(challengeToForm(challenge));
        setDialogOpen(true);
    };

    const set = (field) => (val) => setForm((prev) => ({ ...prev, [field]: val }));

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateChallenge(challengeId, {
                title: form.title.trim(),
                description: form.description.trim(),
                challengeType: form.challengeType,
                difficulty: form.difficulty,
                iconName: form.iconName,
                startDate: Timestamp.fromDate(new Date(form.startDate)),
                endDate: Timestamp.fromDate(new Date(form.endDate)),
                goalValue: Number(form.goalValue),
                status: form.status,
                condition: buildCondition(form),
            });
            setDialogOpen(false);
            fetchChallenge();
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-6"><p className="text-sm text-muted-foreground">Loading...</p></div>;
    }

    if (notFound || !challenge) {
        return (
            <div className="p-6">
                <p className="text-sm text-muted-foreground">Challenge not found.</p>
                <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => router.push("/admin/challenges")}>
                    <IconArrowLeft className="size-4" /> Back to list
                </Button>
            </div>
        );
    }

    const c = challenge;
    const remaining = daysRemaining(c);
    const progressNumerator = c.currentValue ?? 0;
    const progressPercent = c.goalValue > 0 ? Math.min((progressNumerator / c.goalValue) * 100, 100) : 0;

    const canSubmit = form &&
        form.title.trim() !== "" &&
        form.description.trim() !== "" &&
        form.startDate !== "" &&
        form.endDate !== "" && form.endDate > form.startDate &&
        form.goalValue !== "" &&
        (form.conditionType !== "tag_includes" || form.conditionValue.trim() !== "") &&
        (form.conditionType !== "tag_includes_any" || form.conditionValues.trim() !== "");

    return (
        <div className="p-6 max-w-3xl">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => router.push("/admin/challenges")}
                    className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <IconArrowLeft className="size-4" /> Back to list
                </button>
                <div className="flex items-start justify-between gap-4">
                    <h1 className="text-2xl font-bold">{c.title}</h1>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={openEdit}>
                            <IconPencil className="size-4" /> Edit
                        </Button>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary">
                            <ChallengeIcon iconName={c.iconName} className="size-6 text-primary-foreground" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 mb-8">
                {/* Overview */}
                <Card>
                    <CardContent className="p-5 space-y-3">
                        <SectionHeading>Overview</SectionHeading>
                        <InfoRow label="Description" value={c.description} />
                        <div className="flex gap-2 text-sm">
                            <span className="w-40 shrink-0 font-medium text-muted-foreground">Status</span>
                            <Badge variant={STATUS_VARIANT[c.status] ?? "outline"} className="capitalize">{c.status ?? "—"}</Badge>
                        </div>
                        <div className="flex gap-2 text-sm">
                            <span className="w-40 shrink-0 font-medium text-muted-foreground">Difficulty</span>
                            <Badge variant={DIFFICULTY_VARIANT[c.difficulty] ?? "outline"} className="capitalize">{c.difficulty ?? "—"}</Badge>
                        </div>
                        <InfoRow label="Type"       value={TYPE_LABELS[c.challengeType] ?? c.challengeType} />
                        <InfoRow label="Date Range" value={formatDateRange(c)} />
                        {remaining && <InfoRow label="Time Left" value={remaining} />}
                        <InfoRow label="Document ID" value={c.id} />
                    </CardContent>
                </Card>

                {/* Community stats */}
                <Card>
                    <CardContent className="p-5 space-y-3">
                        <SectionHeading>Community Stats</SectionHeading>
                        <div className="flex flex-wrap gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <IconUsers className="size-4 text-muted-foreground" />
                                <span className="font-medium">{(c.participantCount ?? 0).toLocaleString()}</span>
                                <span className="text-muted-foreground">participants</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <IconClock className="size-4 text-muted-foreground" />
                                <span className="font-medium">{progressNumerator.toLocaleString()}</span>
                                <span className="text-muted-foreground">/ {(c.goalValue ?? 0).toLocaleString()} goal</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Community Progress</span>
                                <span className="font-semibold text-primary">{progressNumerator} / {c.goalValue ?? 0}</span>
                            </div>
                            <Progress value={progressPercent} className="h-2.5" />
                        </div>
                    </CardContent>
                </Card>

                {/* Condition */}
                {c.condition && (
                    <Card>
                        <CardContent className="p-5 space-y-3">
                            <SectionHeading>Condition</SectionHeading>
                            <InfoRow label="Type" value={c.condition.type} />
                            {c.condition.value && <InfoRow label="Value" value={c.condition.value} />}
                            {c.condition.values?.length > 0 && (
                                <div className="flex gap-2 text-sm">
                                    <span className="w-40 shrink-0 font-medium text-muted-foreground">Values</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {c.condition.values.map((v) => (
                                            <Badge key={v} variant="secondary">{v}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Tabs */}
            <TabBar active={activeTab} onChange={setActiveTab} />
            {activeTab === "participants" && (
                <ParticipantsTab challengeId={challengeId} currentUserId={user?.uid ?? null} goalValue={c.goalValue} challengeType={c.challengeType} />
            )}
            {activeTab === "posts" && (
                <ViewPostsTab challengeId={challengeId} currentUserId={user?.uid ?? null} />
            )}

            {/* Edit Dialog */}
            {form && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Challenge</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label>Title</Label>
                                <Input value={form.title} onChange={(e) => set("title")(e.target.value)} />
                            </div>

                            <div className="space-y-1.5">
                                <Label>Description</Label>
                                <Textarea value={form.description} onChange={(e) => set("description")(e.target.value)} rows={2} />
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

                            <div className="grid grid-cols-2 gap-3">
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
                                <div className="space-y-1.5">
                                    <Label>Status</Label>
                                    <Select value={form.status} onValueChange={set("status")}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="expired">Expired</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>Start Date</Label>
                                    <Input type="date" value={form.startDate} onChange={(e) => set("startDate")(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>End Date</Label>
                                    <Input type="date" min={form.startDate} value={form.endDate} onChange={(e) => set("endDate")(e.target.value)} />
                                    {form.endDate && form.startDate && form.endDate <= form.startDate && (
                                        <p className="text-xs text-destructive">End date must be after start date.</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Goal Value</Label>
                                <Input type="number" min={1} value={form.goalValue} onChange={(e) => set("goalValue")(e.target.value)} />
                            </div>

                            <div className="space-y-3 rounded-md border border-border p-3">
                                <Label>Condition (optional)</Label>
                                <Select value={form.conditionType} onValueChange={set("conditionType")}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CONDITION_TYPES.map((ct) => (
                                            <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
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
                            <Button onClick={handleSave} disabled={!canSubmit || saving}>
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
