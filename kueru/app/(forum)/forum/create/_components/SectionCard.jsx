export default function SectionCard({ icon: Icon, title, subtitle, required, children }) {
    return (
        <div className="rounded-xl border-l-4 border-l-primary border border-border bg-white shadow-sm overflow-hidden">
            <div className="px-6 pt-5 pb-3 flex items-start gap-3">
                <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                    <Icon className="size-4 text-primary" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-foreground">
                        {title}
                        {required && <span className="ml-1 text-primary">*</span>}
                    </p>
                    {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
                </div>
            </div>
            <div className="px-6 pb-5">
                {children}
            </div>
        </div>
    );
}