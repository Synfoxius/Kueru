import { Label } from "@/components/ui/label";
import { IconInfoCircle } from "@tabler/icons-react";

/** Returns how many days remain until a challenge ends, or null if expired. */
function daysLeft(challenge) {
    const end = challenge.endDate?.toDate?.() ?? new Date(challenge.endDate);
    const diff = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
    return diff > 0 ? diff : null;
}

/** Returns a human-readable qualification hint for a challenge condition. */
function getConditionHint(condition) {
    if (!condition) return null;
    switch (condition.type) {
        case "tag_includes":
            return `Tag your recipe with "${condition.value}" to qualify`;
        case "tag_includes_any":
            return `Tag your recipe with one of: ${(condition.values ?? []).join(", ")}`;
        case "unique_cuisine_tags":
            return "Your recipe must include a cuisine tag (e.g. Italian, Japanese)";
        default:
            return null;
    }
}

/**
 * Optional section in the recipe creation form that lets users link their
 * recipe to one of their active joined challenges.
 *
 * Only renders when there is at least one active joined challenge.
 *
 * Props:
 *   challenges          Challenge[]   active joined challenges for this user
 *   selectedChallengeId string        currently selected challenge ID ("" = none)
 *   onSelect            fn(id: string) called when the selection changes
 *   loading             boolean       true while challenges are being fetched
 */
export default function RecipeChallengeSection({ challenges, selectedChallengeId, onSelect, loading }) {
    // Don't render the section at all if there are no active challenges (and not loading)
    if (!loading && challenges.length === 0) return null;

    const selectedChallenge = challenges.find((c) => c.id === selectedChallengeId) ?? null;
    const hint = selectedChallenge ? getConditionHint(selectedChallenge.condition ?? null) : null;

    return (
        <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Link to Challenge</h3>
            <p className="text-xs text-muted-foreground -mt-1">
                Contribute this recipe to an active challenge you've joined (optional)
            </p>

            <div className="space-y-1.5">
                <Label htmlFor="challenge-select">Challenge</Label>
                <select
                    id="challenge-select"
                    value={selectedChallengeId}
                    onChange={(e) => onSelect(e.target.value)}
                    disabled={loading}
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? (
                        <option value="">Loading challenges…</option>
                    ) : (
                        <>
                            <option value="">— No challenge —</option>
                            {challenges.map((c) => {
                                const days = daysLeft(c);
                                const label = days ? `${c.title} · ${days}d left` : c.title;
                                return (
                                    <option key={c.id} value={c.id}>
                                        {label}
                                    </option>
                                );
                            })}
                        </>
                    )}
                </select>

                {hint && (
                    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <IconInfoCircle className="size-3.5 mt-0.5 shrink-0 text-primary" />
                        {hint}
                    </p>
                )}
            </div>
        </section>
    );
}
