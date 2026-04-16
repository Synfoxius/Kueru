import { IconExternalLink } from "@tabler/icons-react";

/**
 * Detect whether a Firebase Storage URL points to an image or PDF by
 * decoding the URL-encoded file path embedded in the pathname.
 * e.g. .../o/verification-docs%2FuserID%2Ffile.pdf?alt=media&token=...
 */
function getFileType(url) {
    try {
        const decoded = decodeURIComponent(new URL(url).pathname);
        const ext = decoded.split(".").pop()?.toLowerCase();
        if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "image";
        if (ext === "pdf") return "pdf";
    } catch {}
    return "unknown";
}

/**
 * Renders an inline preview card for a single document URL.
 * - Images  → <img> (click to open full-size)
 * - PDFs    → <iframe> (browser native PDF viewer)
 * - Unknown → placeholder with fallback open link
 *
 * @param {{ url: string, index: number }} props
 */
export default function DocumentPreview({ url, index }) {
    const type = getFileType(url);

    return (
        <div className="overflow-hidden rounded-md border border-border bg-muted/30">
            {type === "image" ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={url}
                        alt={`Document ${index + 1}`}
                        className="h-48 w-full object-contain bg-muted/50"
                    />
                </a>
            ) : type === "pdf" ? (
                <iframe
                    src={url}
                    title={`Document ${index + 1}`}
                    className="h-48 w-full border-0"
                />
            ) : (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                    Preview unavailable
                </div>
            )}
            <div className="flex items-center justify-between border-t border-border px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground">
                    Document {index + 1}
                </span>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                    Open <IconExternalLink className="size-3" />
                </a>
            </div>
        </div>
    );
}
