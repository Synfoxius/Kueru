import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconChevronRight } from "@tabler/icons-react";

export default function DiscoverSectionHeader({ title, href }) {
    return (
        <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
            {href ? (
                <Button asChild variant="link" className="h-auto gap-1 p-0 text-primary">
                    <Link href={href} className="inline-flex items-center gap-1">
                        <span>See More</span>
                        <IconChevronRight className="size-4" />
                    </Link>
                </Button>
            ) : null}
        </div>
    );
}
