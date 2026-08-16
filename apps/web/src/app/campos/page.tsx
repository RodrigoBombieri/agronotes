import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getFields, getViewer } from "@/lib/queries/catalog";
import { PRICE_PER_FIELD_ARS } from "@/lib/subscription-status";
import { CreateFieldForm, FieldRowActions } from "@/components/catalog-forms";

// apps/web/src/app/campos/page.tsx — Etapa 6 (2026-08-16).
//
// ABM de campos. Es la pantalla que faltaba para que un cliente pueda
// configurar la app solo: hasta ahora los campos había que crearlos a mano
// en la base. Ojo con el detalle de negocio: la cantidad de campos activos
// es lo que define el monto de la suscripción, por eso se avisa acá mismo.

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default async function CamposPage() {
  const supabase = await createClient();
  const viewer = await getViewer(supabase);

  if (!viewer) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-sm font-semibold text-ink-muted">
          No se pudo cargar tu perfil de usuario.
        </p>
      </div>
    );
  }

  const fields = await getFields(supabase);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-xl font-extrabold text-brand-900">Campos</h1>
      <p className="mb-6 text-sm font-semibold text-ink-muted">
        Cada campo activo suma {currencyFormatter.format(PRICE_PER_FIELD_ARS)} por mes a la
        suscripción. Si cambiás la cantidad, acordate de actualizar el monto en{" "}
        <Link href="/suscripcion" className="text-brand-700 underline underline-offset-2">
          Suscripción
        </Link>
        .
      </p>

      {viewer.isAdmin ? (
        <section className="mb-8 rounded-2xl border border-line bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-extrabold text-brand-800">Agregar un campo</h2>
          <CreateFieldForm />
        </section>
      ) : (
        <p className="mb-6 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink-muted">
          Solo un admin de la organización puede crear o modificar campos.
        </p>
      )}

      {fields.length === 0 ? (
        <p className="text-sm font-semibold text-ink-muted">
          Todavía no hay campos cargados. Agregá el primero para poder empezar a registrar tareas.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
          <table className="w-full text-sm">
            <caption className="sr-only">Campos de la organización</caption>
            <thead className="bg-brand-50 text-left">
              <tr>
                <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">
                  Campo
                </th>
                <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">
                  Lotes
                </th>
                {viewer.isAdmin && (
                  <th scope="col" className="px-3 py-2.5 text-right text-xs font-extrabold uppercase tracking-wide text-brand-800">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field.id} className="border-t border-line font-semibold text-ink">
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/campos/${field.id}`}
                      className="font-extrabold text-brand-800 underline underline-offset-2"
                    >
                      {field.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-ink-muted">{field.plotsCount}</td>
                  {viewer.isAdmin && (
                    <td className="px-3 py-2.5">
                      <FieldRowActions id={field.id} name={field.name} />
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
