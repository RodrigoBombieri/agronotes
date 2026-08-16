import { getPlatformSummary, statusLabel } from "@/lib/queries/admin";
import { StatCard } from "@/components/stat-card";

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminPage() {
  const summary = await getPlatformSummary();

  return (
    <div>
      <h1 className="mb-6 text-xl font-extrabold text-brand-900">
        Suscripciones y pagos — todas las organizaciones
      </h1>

      <section aria-label="Resumen" className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Organizaciones (total)" value={summary.totalOrganizations} />
        {summary.byStatus.map((s) => (
          <StatCard key={s.status} label={statusLabel(s.status)} value={s.count} />
        ))}
      </section>

      <section
        aria-labelledby="pagos-heading"
        className="rounded-2xl border border-line bg-white p-5 shadow-sm"
      >
        <h2 id="pagos-heading" className="mb-4 text-sm font-extrabold text-brand-800">
          Últimos eventos de pago (Mercado Pago)
        </h2>
        {summary.recentEvents.length === 0 ? (
          <p className="text-sm font-semibold text-ink-muted">
            Todavía no llegó ningún evento de pago — recién quedan registrados a partir de hoy
            (2026-08-16), los anteriores al webhook no se guardaron.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <caption className="sr-only">Últimos eventos de pago recibidos</caption>
              <thead className="bg-brand-50 text-left">
                <tr>
                  <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">
                    Fecha
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">
                    Organización
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">
                    Estado resultante
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.recentEvents.map((event) => (
                  <tr key={event.id} className="border-t border-line font-semibold text-ink">
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {dateTimeFormatter.format(new Date(event.receivedAt))}
                    </td>
                    <td className="px-3 py-2.5">{event.organizationName}</td>
                    <td className="px-3 py-2.5">
                      {event.resultingStatus ? statusLabel(event.resultingStatus) : "—"}
                    </td>
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
