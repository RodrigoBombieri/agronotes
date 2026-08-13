import { createClient } from "@/lib/supabase/server";
import { getFilterOptions, getTasksPage, PAGE_SIZE, type TaskFilters } from "@/lib/queries/tasks";
import { TaskFiltersForm } from "@/components/task-filters-form";
import { Pagination } from "@/components/pagination";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

type SearchParams = {
  campo?: string;
  lote?: string;
  tipo?: string;
  usuario?: string;
  desde?: string;
  hasta?: string;
  page?: string;
};

function toFilters(params: SearchParams): TaskFilters {
  return {
    fieldId: params.campo || undefined,
    plotId: params.lote || undefined,
    taskTypeId: params.tipo || undefined,
    userId: params.usuario || undefined,
    from: params.desde || undefined,
    to: params.hasta || undefined,
    page: params.page ? Math.max(0, parseInt(params.page, 10) || 0) : 0,
  };
}

export default async function TareasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = toFilters(params);

  const supabase = await createClient();
  const [options, { rows, count }] = await Promise.all([
    getFilterOptions(supabase),
    getTasksPage(supabase, filters),
  ]);

  const exportQs = new URLSearchParams();
  if (params.campo) exportQs.set("campo", params.campo);
  if (params.lote) exportQs.set("lote", params.lote);
  if (params.tipo) exportQs.set("tipo", params.tipo);
  if (params.usuario) exportQs.set("usuario", params.usuario);
  if (params.desde) exportQs.set("desde", params.desde);
  if (params.hasta) exportQs.set("hasta", params.hasta);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-brand-900">Tareas</h1>
        <a
          href={`/tareas/export${exportQs.toString() ? `?${exportQs}` : ""}`}
          className="rounded-lg bg-tan-500 px-3 py-1.5 text-sm font-extrabold text-white hover:opacity-90"
        >
          Exportar CSV
        </a>
      </div>

      <TaskFiltersForm
        options={options}
        current={{
          campo: params.campo,
          lote: params.lote,
          tipo: params.tipo,
          usuario: params.usuario,
          desde: params.desde,
          hasta: params.hasta,
        }}
      />

      {rows.length === 0 ? (
        <p className="text-sm font-semibold text-ink-muted">
          No hay tareas que coincidan con estos filtros.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
          <table className="w-full text-sm">
            <caption className="sr-only">Listado de tareas registradas</caption>
            <thead className="bg-brand-50 text-left">
              <tr>
                <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">Fecha</th>
                <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">Tipo</th>
                <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">Campo</th>
                <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">Lote</th>
                <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">Cantidad</th>
                <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">Usuario</th>
                <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">Nota</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tarea) => (
                <tr key={tarea.id} className="border-t border-line font-semibold text-ink">
                  <td className="px-3 py-2.5 whitespace-nowrap">{dateFormatter.format(new Date(tarea.occurredAt))}</td>
                  <td className="px-3 py-2.5">{tarea.tipo}</td>
                  <td className="px-3 py-2.5">{tarea.campo}</td>
                  <td className="px-3 py-2.5">{tarea.lote}</td>
                  <td className="px-3 py-2.5 tabular-nums whitespace-nowrap">
                    {tarea.quantity} {tarea.unit}
                  </td>
                  <td className="px-3 py-2.5">{tarea.usuario}</td>
                  <td className="px-3 py-2.5 text-ink-muted">{tarea.note ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={filters.page}
        pageSize={PAGE_SIZE}
        total={count}
        searchParams={{
          campo: params.campo,
          lote: params.lote,
          tipo: params.tipo,
          usuario: params.usuario,
          desde: params.desde,
          hasta: params.hasta,
        }}
      />
    </div>
  );
}
