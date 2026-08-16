import { createClient } from "@/lib/supabase/server";
import { getTaskTypes, getViewer } from "@/lib/queries/catalog";
import { CreateTaskTypeForm, TaskTypeRowActions } from "@/components/catalog-forms";

// apps/web/src/app/tipos/page.tsx — Etapa 6 (2026-08-16).
//
// ABM de tipos de tarea. Hay dos clases y se distinguen a propósito en la
// tabla: los **globales** vienen con el producto para todas las
// organizaciones (`organization_id` nulo) y no se editan ni se dan de baja
// desde acá; los **propios** los crea cada organización. La policy de RLS
// ya impide tocar los globales aunque alguien fuerce un id a mano.

export default async function TiposPage() {
  const supabase = await createClient();
  const [viewer, taskTypes] = await Promise.all([getViewer(supabase), getTaskTypes(supabase)]);

  const globals = taskTypes.filter((type) => type.isGlobal);
  const custom = taskTypes.filter((type) => !type.isGlobal);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-xl font-extrabold text-brand-900">Tipos de tarea</h1>
      <p className="mb-6 text-sm font-semibold text-ink-muted">
        Son las opciones que aparecen en el paso 2 del alta de tarea en el celular. La unidad por
        defecto se precarga al elegir el tipo, pero el operario la puede cambiar.
      </p>

      {viewer?.isAdmin ? (
        <section className="mb-8 rounded-2xl border border-line bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-extrabold text-brand-800">
            Agregar un tipo propio de tu organización
          </h2>
          <CreateTaskTypeForm />
        </section>
      ) : (
        <p className="mb-6 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink-muted">
          Solo un admin de la organización puede crear o modificar tipos de tarea.
        </p>
      )}

      <h2 className="mb-3 text-sm font-extrabold text-brand-800">Tipos propios</h2>
      {custom.length === 0 ? (
        <p className="mb-8 text-sm font-semibold text-ink-muted">
          Todavía no creaste ninguno. Con los tipos que vienen incluidos (abajo) ya podés empezar.
        </p>
      ) : (
        <div className="mb-8 overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
          <table className="w-full text-sm">
            <caption className="sr-only">Tipos de tarea propios de la organización</caption>
            <thead className="bg-brand-50 text-left">
              <tr>
                <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">
                  Tipo
                </th>
                <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">
                  Unidad por defecto
                </th>
                {viewer?.isAdmin && (
                  <th scope="col" className="px-3 py-2.5 text-right text-xs font-extrabold uppercase tracking-wide text-brand-800">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {custom.map((type) => (
                <tr key={type.id} className="border-t border-line font-semibold text-ink">
                  <td className="px-3 py-2.5">{type.name}</td>
                  <td className="px-3 py-2.5 text-ink-muted">{type.defaultUnit}</td>
                  {viewer?.isAdmin && (
                    <td className="px-3 py-2.5">
                      <TaskTypeRowActions
                        id={type.id}
                        name={type.name}
                        defaultUnit={type.defaultUnit}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mb-3 text-sm font-extrabold text-brand-800">Tipos incluidos</h2>
      <p className="mb-3 text-sm font-semibold text-ink-muted">
        Vienen con Agronotes y están disponibles para todas las organizaciones. No se editan ni se
        dan de baja.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full text-sm">
          <caption className="sr-only">Tipos de tarea incluidos con el producto</caption>
          <thead className="bg-brand-50 text-left">
            <tr>
              <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">
                Tipo
              </th>
              <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">
                Unidad por defecto
              </th>
            </tr>
          </thead>
          <tbody>
            {globals.map((type) => (
              <tr key={type.id} className="border-t border-line font-semibold text-ink">
                <td className="px-3 py-2.5">{type.name}</td>
                <td className="px-3 py-2.5 text-ink-muted">{type.defaultUnit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
