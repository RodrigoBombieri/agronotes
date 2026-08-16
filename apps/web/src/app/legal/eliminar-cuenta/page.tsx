import { AccountDeletionForm } from "@/components/account-deletion-form";

// apps/web/src/app/legal/eliminar-cuenta/page.tsx — Etapa 6 (2026-08-16).
//
// Página pública (no requiere sesión — habilitada en publicPaths del
// middleware) que cumple con la exigencia de Google Play de tener una vía
// de eliminación de cuenta que funcione sin tener la app instalada ni
// poder iniciar sesión. La misma acción también se ofrece dentro de la app
// mobile, cerca de "Cerrar sesión".
export default function EliminarCuentaPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="rounded-3xl border border-line bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-xl font-extrabold text-brand-900">Eliminar tu cuenta</h1>
        <p className="mb-6 text-sm font-semibold text-ink-muted">
          Al pedir la eliminación de tu cuenta, borramos tu usuario y dejamos de darte acceso a
          Agronotes. Las tareas de campo que cargaste quedan registradas a nombre de tu
          organización (como cualquier registro contable o histórico de trabajo), pero tus datos
          personales (nombre y email) se eliminan de nuestros sistemas. Si sos el único admin de
          una organización, contactanos primero para transferir la administración o dar de baja
          también la organización.
        </p>
        <AccountDeletionForm />
        <p className="mt-6 text-xs font-semibold text-ink-faint">
          También podés pedirlo escribiendo directamente a{" "}
          <a href="mailto:rodrigosbombieri@gmail.com" className="font-extrabold text-brand-700">
            rodrigosbombieri@gmail.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
