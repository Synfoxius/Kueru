import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconArrowLeft } from "@tabler/icons-react";

export default function BackToForumButton() {
    return (
        <div className="border border-border rounded-lg w-fit">
            <Link href="/forum">
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground rounded-lg">
                    <IconArrowLeft className="size-4" />
                    Back to Forum
                </Button>
            </Link>
        </div>
    );
}