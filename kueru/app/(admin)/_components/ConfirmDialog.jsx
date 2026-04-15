import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Reusable confirmation dialog.
 *
 * Pass `children` to render additional form content (e.g. a note input)
 * between the description and the footer buttons.
 *
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   title: string,
 *   description?: string,
 *   confirmLabel?: string,
 *   onConfirm: () => void,
 *   loading?: boolean,
 *   variant?: string,
 *   children?: React.ReactNode,
 * }} props
 */
export default function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Confirm",
    onConfirm,
    loading = false,
    variant = "destructive",
    children,
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>
                {children}
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={variant}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
