import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTasksForExport } from "@/lib/queries/tasks";

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const supabase = await createClient();
  const rows = await getTasksForExport(supabase, {
    fieldId: params.get("campo") || undefined,
    plotId: params.get("lote") || undefined,
    taskTypeId: params.get("tipo") || undefined,
    userId: params.get("usuario") || undefined,
    from: params.get("desde") || undefined,
    to: params.get("hasta") || undefined,
  });

  const header = ["Fecha", "Tipo", "Campo", "Lote", "Cantidad", "Unidad", "Usuario", "Nota"];
  const lines = [header.join(";")];

  for (const row of rows) {
    lines.push(
      [
        new Date(row.occurredAt).toISOString().slice(0, 10),
        row.tipo,
        row.campo,
        row.lote,
        row.quantity,
        row.unit,
        row.usuario,
        row.note ?? "",
      ]
        .map(csvEscape)
        .join(";"),
    );
  }

  // BOM para que Excel detecte UTF-8 correctamente en Windows.
  const csv = "﻿" + lines.join("\n");
  const fecha = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tareas-${fecha}.csv"`,
    },
  });
}
