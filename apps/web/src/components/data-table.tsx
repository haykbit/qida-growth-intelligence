import { Button, CardContent, cn } from "@qida/ui";
import { flexRender, type Table } from "@tanstack/react-table";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "./feedback";

type ColumnAlign = "left" | "right" | "center";

export type DataColumn<Row> = {
  id: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  align?: ColumnAlign;
  className?: string;
  headerClassName?: string;
  hideBelow?: "sm" | "md" | "lg" | "xl";
};

const hiddenClasses = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
} as const;

const alignmentClasses = { left: "text-left", right: "text-right", center: "text-center" } as const;

export function DataTable<Row>({ rows, columns, rowKey, rowClassName, rowDescription, emptyTitle, minWidth = "min-w-[720px]", componentId = "data-table" }: {
  rows: Row[];
  columns: Array<DataColumn<Row>>;
  rowKey: (row: Row, index: number) => string;
  rowClassName?: (row: Row) => string | undefined;
  rowDescription?: (row: Row) => string;
  emptyTitle?: string;
  minWidth?: string;
  componentId?: string;
}) {
  if (!rows.length) return <EmptyState title={emptyTitle ?? "No hay datos para esta selección"} />;
  return <CardContent className="p-0" data-component-id={componentId}><div className="overflow-x-auto"><table className={cn("data-table", minWidth)}><thead><tr>{columns.map((column) => <th key={column.id} scope="col" className={cn(alignmentClasses[column.align ?? "left"], column.hideBelow && hiddenClasses[column.hideBelow], column.headerClassName)}>{column.header}</th>)}</tr></thead><tbody>{rows.map((row, index) => { const description = rowDescription?.(row); return <tr key={rowKey(row, index)} className={rowClassName?.(row)} aria-description={description}>{columns.map((column) => <td key={column.id} className={cn(alignmentClasses[column.align ?? "left"], column.hideBelow && hiddenClasses[column.hideBelow], column.className)}>{column.cell(row)}</td>)}</tr>; })}</tbody></table></div></CardContent>;
}

export function TanStackDataTable<Row>({ table, componentId = "tanstack-data-table" }: { table: Table<Row>; componentId?: string }) {
  const rows = table.getRowModel().rows;
  if (!rows.length) return <EmptyState />;
  return <CardContent className="overflow-x-auto p-0" data-component-id={componentId}><table className="data-table min-w-[820px]"><thead>{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id} scope="col">{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>)}</thead><tbody>{rows.map((row) => <tr key={row.id}>{row.getVisibleCells().map((cell) => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table></CardContent>;
}

export function TablePagination({ page, pageSize, total, onPageChange }: { page: number; pageSize: number; total: number; onPageChange: (page: number) => void }) {
  if (total <= pageSize) return null;
  const pageCount = Math.ceil(total / pageSize);
  return <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm" data-component-id="table-pagination"><span className="text-slate-500">Página {page} de {pageCount}</span><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ArrowLeft className="size-4" />Anterior</Button><Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>Siguiente<ArrowRight className="size-4" /></Button></div></div>;
}
