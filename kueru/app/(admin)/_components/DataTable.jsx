import { useMemo, useState } from "react";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { IconSearch } from "@tabler/icons-react";

/**
 * Generic admin data table.
 *
 * @param {{
 *   columns: { key: string, label: string, render?: (row: object) => React.ReactNode }[],
 *   data: object[],
 *   loading?: boolean,
 *   renderActions?: (row: object) => React.ReactNode,
 *   emptyMessage?: string,
 *   searchKeys?: string[],
 * }} props
 */
export default function DataTable({
    columns,
    data,
    loading = false,
    renderActions,
    emptyMessage = "No data found.",
    searchKeys,
    headerAction,
}) {
    const [query, setQuery] = useState("");
    const colSpan = columns.length + (renderActions ? 1 : 0);

    const displayed = useMemo(() => {
        if (!searchKeys?.length || !query.trim()) return data;
        const q = query.trim().toLowerCase();
        return data.filter((row) =>
            searchKeys.some((key) => {
                const val = row[key];
                return val != null && String(val).toLowerCase().includes(q);
            })
        );
    }, [data, query, searchKeys]);

    return (
        <div className="space-y-3">
            {(searchKeys?.length > 0 || headerAction) && (
                <div className="flex items-center justify-between gap-4">
                    {searchKeys?.length > 0 && (
                        <div className="relative w-full max-w-sm">
                            <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Search…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    )}
                    {headerAction && <div className="shrink-0">{headerAction}</div>}
                </div>
            )}
            <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col) => (
                                <TableHead key={col.key}>{col.label}</TableHead>
                            ))}
                            {renderActions && (
                                <TableHead className="text-right">Actions</TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={colSpan}
                                    className="py-10 text-center text-sm text-muted-foreground"
                                >
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : displayed.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={colSpan}
                                    className="py-10 text-center text-sm text-muted-foreground"
                                >
                                    {query.trim() ? "No results match your search." : emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            displayed.map((row, i) => (
                                <TableRow key={row.id ?? row.userId ?? i}>
                                    {columns.map((col) => (
                                        <TableCell key={col.key}>
                                            {col.render
                                                ? col.render(row)
                                                : (row[col.key] ?? "—")}
                                        </TableCell>
                                    ))}
                                    {renderActions && (
                                        <TableCell className="text-right">
                                            {renderActions(row)}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
