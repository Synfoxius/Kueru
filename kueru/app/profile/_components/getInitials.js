/**
 * Extracts up to two initials from a name or username string.
 * e.g. "Sarah Johnson" -> "SJ", "alice" -> "AL"
 */
export function getInitials(name) {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}
