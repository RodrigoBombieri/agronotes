import { createClient } from "@/lib/supabase/server";
import { getOrgUsers, getViewer } from "@/lib/queries/catalog";
import { InviteUserForm, UserRowActions } from "@/components/user-forms";

// apps/web/src/app/usuarios/page.tsx — Etapa 6 (2026-08-16).
//
// Gestión de los usuarios de la organización. La invitación llama a la Edge
// Function `invite-user`, que existía desde la Etapa 3 pero no la usaba
// nadie porque no había pantalla: hasta hoy sumar un empleado significaba
// crearlo a mano en el panel de Supabase.

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  operario: "Operario",
};

export default async function UsuariosPage() {
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

  const users = await getOrgUsers(supabase, viewer.userId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-xl font-extrabold text-brand-900">Usuarios</h1>
      <p className="mb-6 text-sm font-semibold text-ink-muted">
        Los operarios cargan tareas desde el celular y ven todo el cuaderno de la organización. Los
        admin además gestionan campos, lotes, tipos, usuarios y la suscripción.
      </p>

      {viewer.isAdmin ? (
        <section className="mb-8 rounded-2xl border border-line bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-extrabold text-brand-800">Invitar a alguien</h2>
          <InviteUserForm />
        </section>
      ) : (
        <p className="mb-6 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink-muted">
          Solo un admin de la organización puede invitar o modificar usuarios.
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full text-sm">
          <caption className="sr-only">Usuarios de la organización</caption>
          <thead className="bg-brand-50 text-left">
            <tr>
              <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">
                Email
              </th>
              <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">
                Nombre
              </th>
              <th scope="col" className="px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-800">
                Rol
              </th>
              {viewer.isAdmin && (
                <th scope="col" className="px-3 py-2.5 text-right text-xs font-extrabold uppercase tracking-wide text-brand-800">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-line font-semibold text-ink">
                <td className="px-3 py-2.5">{user.email}</td>
                <td className="px-3 py-2.5 text-ink-muted">{user.fullName ?? "—"}</td>
                <td className="px-3 py-2.5">{ROLE_LABELS[user.role] ?? user.role}</td>
                {viewer.isAdmin && (
                  <td className="px-3 py-2.5">
                    <UserRowActions
                      id={user.id}
                      email={user.email}
                      role={user.role}
                      isSelf={user.isSelf}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
