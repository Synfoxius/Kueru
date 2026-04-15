export default function HorizontalScroller({ children }) {
    return (
        <div className="-mx-1 overflow-x-auto pb-2">
            <div className="flex min-w-max gap-4 px-1">{children}</div>
        </div>
    );
}
