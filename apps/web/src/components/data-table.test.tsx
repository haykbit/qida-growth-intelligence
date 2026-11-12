import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DataTable } from "./data-table";

type Row = {
  id: string;
  label: string;
  detail: string;
};

const columns = [
  { id: "label", header: "Nombre", cell: (row: Row) => row.label },
  {
    id: "detail",
    header: "Detalle",
    cell: (row: Row) => row.detail,
    hideBelow: "md" as const,
  },
];

describe("DataTable", () => {
  it("renders accessible headings and responsive column visibility", () => {
    const markup = renderToStaticMarkup(
      <DataTable
        columns={columns}
        rows={[{ id: "1", label: "Madrid", detail: "Cuidados" }]}
        rowKey={(row) => row.id}
      />,
    );

    expect(markup).toContain('<table');
    expect(markup).toContain('scope="col"');
    expect(markup).toContain("Nombre");
    expect(markup).toContain("Madrid");
    expect(markup).toContain("hidden md:table-cell");
  });

  it("renders the configured empty state", () => {
    const markup = renderToStaticMarkup(
      <DataTable columns={columns} rows={[]} rowKey={(row) => row.id} emptyTitle="Sin resultados" />,
    );

    expect(markup).toContain("Sin resultados");
  });
});
