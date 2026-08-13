import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDashboardSummary } from "@/lib/queries/dashboard";
import { StatCard } from "@/components/stat-card";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function DashboardPage() {
  const supabase = await createClient();
  const summary = await getDashboardSummary(supabase);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-brand-900">Dashboard</h1>
        <Link
          href="/tareas"
          className="text-sm font-bold text-brand-700 underline underline-offset-2 hover:text-brand-900"
        >
          Ver todas las tareas
        </Link>
      </div>

      <section aria-label="Resumen" className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Tareas registradas (total)" value={summary.totalTareas} />
        <StatCard label="Tareas últimos 7 días" value={summary.tareasUltimos7Dias} />
      </section>

      <section aria-labelledby="por-tipo-heading" className="mb-8 rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 id="por-tipo-heading" className="mb-4 text-sm font-extrabold text-brand-800">
          Por tipo de tarea (últimos 30 días)
        </h2>
        {summary.porTipo.length === 0 ? (
          <p className="text-sm font-semibold text-ink-muted">
            Todavía no hay tareas registradas en este período.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {summary.porTipo.map((item) => (
              <li key={item.nombre} className="flex items-center gap-3 text-sm font-bold">
                <span className="w-40 shrink-0 truncate text-ink">{item.nombre}</span>
                <div className="h-2.5 flex-1 rounded-full bg-brand-50">
                  <div
                    className="h-2.5 rounded-full bg-brand-300"
                    style={{
                      width: `${(item.cantidad / summary.porTipo[0].cantidad) * 100}%`,
                    }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right tabular-nums text-ink-muted">{item.cantidad}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recientes-heading" className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 id="recientes-heading" className="mb-4 text-sm font-extrabold text-brand-800">
          Últimos registros
        </h2>
        {summary.recientes.length === 0 ? (
          <p className="text-sm font-semibold text-ink-muted">
            Todavía no se registró ninguna tarea.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <caption className="sr-only">Últimas tareas registradas</caption>
              <thead className="bg-brand-50 text-left">
                <tr>
                  <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">Fecha</th>
                  <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">Tipo</th>
                  <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">Campo</th>
                  <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">Lote</th>
                  <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">Cantidad</th>
                  <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {summary.recientes.map((tarea) => (
                  <tr key={tarea.id} className="border-t border-line font-semibold text-ink">
                    <td className="px-3 py-2.5 whitespace-nowrap">{dateFormatter.format(new Date(tarea.occurredAt))}</td>
                    <td className="px-3 py-2.5">{tarea.tipo}</td>
                    <td className="px-3 py-2.5">{tarea.campo}</td>
                    <td className="px-3 py-2.5">{tarea.lote}</td>
                    <td className="px-3 py-2.5 tabular-nums">
                      {tarea.quantity} {tarea.unit}
                    </td>
                    <td className="px-3 py-2.5">{tarea.usuario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
