import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFieldDetail, getViewer } from "@/lib/queries/catalog";
import { CreatePlotForm, PlotRowActions } from "@/components/catalog-forms";

// apps/web/src/app/campos/[id]/page.tsx — Etapa 6 (2026-08-16).
// ABM de los lotes de un campo. Los lotes son lo que el encargado elige en
// el paso 1 del alta de tarea en el celular, así que sin esta pantalla la
// app mobile no tiene contra qué cargar nada.

export default async function CampoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [viewer, field] = await Promise.all([
    getViewer(supabase),
    getFieldDetail(supabase, id),
  ]);

  if (!field) notFound();

  const totalHectares = field.plots.reduce((sum, plot) => sum + (plot.hectares ?? 0), 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/campos" className="text-sm font-extrabold text-brand-700 underline underline-offset-2">
        ← Volver a campos
      </Link>

      <h1 className="mt-3 mb-1 text-xl font-extrabold text-brand-900">{field.name}</h1>
      <p className="mb-6 text-sm font-semibold text-ink-muted">
        {field.plots.length} lote{field.plots.length === 1 ? "" : "s"}
        {totalHectares > 0 && ` · ${totalHectares.toLocaleString("es-AR")} ha en total`}
      </p>

      {viewer?.isAdmin ? (
        <section className="mb-8 rounded-2xl border border-line bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-extrabold text-brand-800">Agregar un lote</h2>
          <CreatePlotForm fieldId={field.id} />
        </section>
      ) : (
        <p className="mb-6 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink-muted">
          Solo un admin de la organización puede crear o modificar lotes.
        </p>
      )}

      {field.plots.length === 0 ? (
        <p className="text-sm font-semibold text-ink-muted">
          Este campo todavía no tiene lotes. Agregá al menos uno para poder registrar tareas.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
          <table className="w-full text-sm">
            <caption className="sr-only">Lotes de {field.name}</caption>
            <thead className="bg-brand-50 text-left">
              <tr>
                <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">
                  Lote
                </th>
                <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">
                  Hectáreas
                </th>
                <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">
                  Tareas
                </th>
                {viewer?.isAdmin && (
                  <th scope="col" className="px-3 py-2.5 text-right text-xs font-extrabold uppercase tracking-wide text-brand-800">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {field.plots.map((plot) => (
                <tr key={plot.id} className="border-t border-line font-semibold text-ink">
                  <td className="px-3 py-2.5">{plot.name}</td>
                  <td className="px-3 py-2.5 tabular-nums text-ink-muted">
                    {plot.hectares === null ? "—" : plot.hectares.toLocaleString("es-AR")}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-ink-muted">{plot.tasksCount}</td>
                  {viewer?.isAdmin && (
                    <td className="px-3 py-2.5">
                      <PlotRowActions
                        id={plot.id}
                        fieldId={field.id}
                        name={plot.name}
                        hectares={plot.hectares}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
