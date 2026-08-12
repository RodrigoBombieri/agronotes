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
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <Link
          href="/tareas"
          className="text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
        >
          Ver todas las tareas
        </Link>
      </div>

      <section aria-label="Resumen" className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Tareas registradas (total)" value={summary.totalTareas} />
        <StatCard label="Tareas últimos 7 días" value={summary.tareasUltimos7Dias} />
      </section>

      <section aria-labelledby="por-tipo-heading" className="mb-8">
        <h2 id="por-tipo-heading" className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Por tipo de tarea (últimos 30 días)
        </h2>
        {summary.porTipo.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Todavía no hay tareas registradas en este período.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {summary.porTipo.map((item) => (
              <li key={item.nombre} className="flex items-center gap-3 text-sm">
                <span className="w-40 shrink-0 truncate">{item.nombre}</span>
                <div className="h-2 flex-1 rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className="h-2 rounded-full bg-neutral-900 dark:bg-white"
                    style={{
                      width: `${(item.cantidad / summary.porTipo[0].cantidad) * 100}%`,
                    }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right tabular-nums">{item.cantidad}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recientes-heading">
        <h2 id="recientes-heading" className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Últimos registros
        </h2>
        {summary.recientes.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Todavía no se registró ninguna tarea.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-sm">
              <caption className="sr-only">Últimas tareas registradas</caption>
              <thead className="bg-neutral-50 text-left dark:bg-neutral-900">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Fecha</th>
                  <th scope="col" className="px-3 py-2 font-medium">Tipo</th>
                  <th scope="col" className="px-3 py-2 font-medium">Campo</th>
                  <th scope="col" className="px-3 py-2 font-medium">Lote</th>
                  <th scope="col" className="px-3 py-2 font-medium">Cantidad</th>
                  <th scope="col" className="px-3 py-2 font-medium">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {summary.recientes.map((tarea) => (
                  <tr key={tarea.id} className="border-t border-neutral-200 dark:border-neutral-800">
                    <td className="px-3 py-2">{dateFormatter.format(new Date(tarea.occurredAt))}</td>
                    <td className="px-3 py-2">{tarea.tipo}</td>
                    <td className="px-3 py-2">{tarea.campo}</td>
                    <td className="px-3 py-2">{tarea.lote}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {tarea.quantity} {tarea.unit}
                    </td>
                    <td className="px-3 py-2">{tarea.usuario}</td>
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
