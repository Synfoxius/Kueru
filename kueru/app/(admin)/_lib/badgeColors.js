/**
 * Shared badge color classes for admin views.
 * Use with variant="outline" — these classes override the base outline colors.
 *
 * Usage:
 *   <Badge variant="outline" className={STATUS_COLOR[status]}>…</Badge>
 */

export const STATUS_COLOR = {
    // content lifecycle
    available:    "bg-green-100 text-green-700 border-green-200",
    pending:      "bg-amber-100 text-amber-700 border-amber-200",
    deleted:      "bg-red-100 text-red-700 border-red-200",
    archived:     "bg-slate-100 text-slate-600 border-slate-200",
    // verification
    under_review: "bg-blue-100 text-blue-700 border-blue-200",
    approved:     "bg-green-100 text-green-700 border-green-200",
    rejected:     "bg-red-100 text-red-700 border-red-200",
    // report
    resolved:     "bg-teal-100 text-teal-700 border-teal-200",
    // user
    active:       "bg-green-100 text-green-700 border-green-200",
    disabled:     "bg-red-100 text-red-700 border-red-200",
    // challenge
    expired:      "bg-slate-100 text-slate-600 border-slate-200",
};

export const ROLE_COLOR = {
    admin:    "bg-purple-100 text-purple-700 border-purple-200",
    chef:     "bg-blue-100 text-blue-700 border-blue-200",
    customer: "bg-slate-100 text-slate-600 border-slate-200",
};

export const DIFFICULTY_COLOR = {
    easy:   "bg-green-100 text-green-700 border-green-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    hard:   "bg-red-100 text-red-700 border-red-200",
};

export const TARGET_TYPE_COLOR = {
    recipe:  "bg-blue-100 text-blue-700 border-blue-200",
    post:    "bg-violet-100 text-violet-700 border-violet-200",
    comment: "bg-slate-100 text-slate-600 border-slate-200",
    user:    "bg-amber-100 text-amber-700 border-amber-200",
};

export const CATEGORY_COLOR = {
    "Cooking Streaks": "bg-orange-100 text-orange-700 border-orange-200",
    "Skill Badges":    "bg-blue-100 text-blue-700 border-blue-200",
    "Exploration":     "bg-teal-100 text-teal-700 border-teal-200",
    "Milestones":      "bg-purple-100 text-purple-700 border-purple-200",
};

/** Active color class for filter tab buttons, keyed by filter value. */
export const FILTER_ACTIVE_COLOR = {
    all:          "bg-background text-foreground shadow-sm",
    available:    "bg-green-100 text-green-700",
    active:       "bg-green-100 text-green-700",
    approved:     "bg-green-100 text-green-700",
    resolved:     "bg-teal-100 text-teal-700",
    pending:      "bg-amber-100 text-amber-700",
    under_review: "bg-blue-100 text-blue-700",
    deleted:      "bg-red-100 text-red-700",
    rejected:     "bg-red-100 text-red-700",
    archived:     "bg-slate-100 text-slate-600",
    expired:      "bg-slate-100 text-slate-600",
};
