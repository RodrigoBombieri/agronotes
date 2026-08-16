import { createClient } from "@/lib/supabase/server";
import { getSubscriptionInfo } from "@/lib/queries/subscription";
import { statusLabel } from "@/lib/subscription-status";
import { StatCard } from "@/components/stat-card";
import { SubscribeButton } from "@/components/subscribe-button";
import { UpdateAmountButton } from "@/components/update-amount-button";

// apps/web/src/app/suscripcion/page.tsx — Etapa 6 (2026-08-16).
//
// Página donde el admin de la organización se suscribe (crea la
// preapproval de Mercado Pago) y, más adelante, actualiza el monto si
// cambió la cantidad de campos activos. El estado real de la suscripción
// (trialing/active/past_due/canceled) lo actualiza el webhook de forma
// asíncrona — esta página solo dispara la acción y muestra el último
// estado que quedó guardado en `subscriptions`, no hace polling.

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

type SearchParams = {
  resultado?: string;
};

export default async function SuscripcionPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { resultado } = await searchParams;
  const supabase = await createClient();
  const info = await getSubscriptionInfo(supabase);

  if (!info) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm font-semibold text-ink-muted">
          No se pudo cargar la información de suscripción.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-xl font-extrabold text-brand-900">Suscripción</h1>

      {resultado === "ok" && (
        <div className="mb-6 rounded-xl border border-brand-300 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-900">
          Volviste de Mercado Pago. Si completaste el pago, puede tardar unos minutos en
          reflejarse acá — actualizá la página en un rato.
        </div>
      )}

      <section aria-label="Resumen" className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Estado" value={statusLabel(info.status)} />
        <StatCard label="Campos activos" value={info.activeFieldsCount} />
        <StatCard label="Monto mensual" value={currencyFormatter.format(info.currentAmount)} />
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-extrabold text-brand-800">Detalle</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-bold text-ink-muted">Precio por campo</dt>
            <dd className="font-semibold text-ink">
              {currencyFormatter.format(info.pricePerField)} / mes
            </dd>
          </div>
          <div>
            <dt className="font-bold text-ink-muted">Próximo cobro</dt>
            <dd className="font-semibold text-ink">
              {info.currentPeriodEnd
                ? dateFormatter.format(new Date(info.currentPeriodEnd))
                : "—"}
            </dd>
          </div>
        </dl>

        {!info.isAdmin ? (
          <p className="mt-5 text-sm font-semibold text-ink-muted">
            Solo un admin de la organización puede gestionar la suscripción.
          </p>
        ) : info.status === "active" ? (
          info.amountIsStale && (
            <div className="mt-5 rounded-xl border border-warning bg-warning-bg px-4 py-3 text-sm font-semibold text-ink">
              <p>
                Contrataste {info.contractedFieldsCount} campo
                {info.contractedFieldsCount === 1 ? "" : "s"}, pero hoy tenés{" "}
                {info.activeFieldsCount} activo{info.activeFieldsCount === 1 ? "" : "s"}. Actualizá
                el monto para que coincida con lo que se cobra.
              </p>
              <div className="mt-3">
                <UpdateAmountButton />
              </div>
            </div>
          )
        ) : (
          <div className="mt-5">
            <SubscribeButton
              disabled={info.activeFieldsCount === 0}
              defaultPayerEmail={info.userEmail}
            />
            {info.activeFieldsCount === 0 && (
              <p className="mt-2 text-sm font-semibold text-ink-muted">
                Cargá al menos un campo antes de suscribirte.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
