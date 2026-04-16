import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";

/**
 * Generic admin data table.
 *
 * @param {{
 *   columns: { key: string, label: string, render?: (row: object) => React.ReactNode }[],
 *   data: object[],
 *   loading?: boolean,
 *   renderActions?: (row: object) => React.ReactNode,
 *   emptyMessage?: string,
 * }} props
 */
export default function DataTable({
    columns,
    data,
    loading = false,
    renderActions,
    emptyMessage = "No data found.",
}) {
    const colSpan = columns.length + (renderActions ? 1 : 0);

    return (
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
                    ) : data.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={colSpan}
                                className="py-10 text-center text-sm text-muted-foreground"
                            >
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((row, i) => (
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
    );
}
