"use client";

import { useActionState, useRef } from "react";
import { initialActionState, type ActionState } from "@/lib/actions/types";
import { deactivateUser, inviteUser, updateUserRole } from "@/lib/actions/users";

// apps/web/src/components/user-forms.tsx — Etapa 6 (2026-08-16).
// Invitación y gestión de los usuarios de la organización. Mismo patrón que
// catalog-forms.tsx: el efecto de "limpiar el formulario si salió bien" se
// hace envolviendo la Server Action, no en un useEffect (ver el comentario
// largo de ese archivo para el porqué).

const inputClass =
  "rounded-xl border-2 border-line bg-white px-3 py-2 text-sm font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500";
const primaryButtonClass =
  "rounded-xl bg-brand-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-brand-700 disabled:opacity-60";
const linkButtonClass =
  "rounded-lg px-2 py-1 text-xs font-extrabold text-brand-700 hover:bg-brand-50 disabled:opacity-60";
const dangerLinkClass =
  "rounded-lg px-2 py-1 text-xs font-extrabold text-danger hover:bg-danger-bg disabled:opacity-60";

function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-sm font-bold text-danger">
      {message}
    </p>
  );
}

export function InviteUserForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await inviteUser(prev, formData);
      if (result.ok) formRef.current?.reset();
      return result;
    },
    initialActionState,
  );

  return (
    <div>
      <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="invitar-email" className="text-xs font-bold text-ink-muted">
            Email
          </label>
          <input
            id="invitar-email"
            name="email"
            type="email"
            required
            placeholder="encargado@campo.com"
            className={`${inputClass} w-64`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="invitar-nombre" className="text-xs font-bold text-ink-muted">
            Nombre (opcional)
          </label>
          <input id="invitar-nombre" name="fullName" maxLength={120} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="invitar-rol" className="text-xs font-bold text-ink-muted">
            Rol
          </label>
          <select id="invitar-rol" name="role" defaultValue="operario" className={inputClass}>
            <option value="operario">Operario</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Invitando…" : "Invitar"}
        </button>
      </form>
      {state.ok && !state.error && (
        <p className="mt-1.5 text-sm font-bold text-success">
          Invitación enviada. La persona recibe un mail con el link para poner su contraseña.
        </p>
      )}
      <ErrorText message={state.error} />
    </div>
  );
}

export function UserRowActions({
  id,
  email,
  role,
  isSelf,
}: {
  id: string;
  email: string;
  role: string;
  isSelf: boolean;
}) {
  const [roleState, roleAction, savingRole] = useActionState(updateUserRole, initialActionState);
  const [offState, offAction, deactivating] = useActionState(deactivateUser, initialActionState);

  // Sobre el propio usuario no se ofrecen acciones: si un admin se baja el
  // rol a sí mismo o se da de baja, la organización puede quedar sin
  // ningún admin y sin forma de recuperarse desde el panel.
  if (isSelf) {
    return <span className="text-xs font-bold text-ink-faint">Sos vos</span>;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      <form action={roleAction} className="flex items-center gap-1">
        <input type="hidden" name="id" value={id} />
        <label htmlFor={`rol-${id}`} className="sr-only">
          Rol de {email}
        </label>
        <select
          id={`rol-${id}`}
          name="role"
          defaultValue={role}
          className="rounded-lg border-2 border-line bg-white px-2 py-1 text-xs font-bold text-ink"
        >
          <option value="operario">Operario</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" disabled={savingRole} className={linkButtonClass}>
          {savingRole ? "Guardando…" : "Cambiar rol"}
        </button>
      </form>

      <form
        action={offAction}
        onSubmit={(event) => {
          if (
            !confirm(
              `¿Dar de baja a ${email}? Deja de poder usar la app. Las tareas que ya cargó se conservan.`,
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button type="submit" disabled={deactivating} className={dangerLinkClass}>
          {deactivating ? "Dando de baja…" : "Dar de baja"}
        </button>
      </form>

      <ErrorText message={roleState.error ?? offState.error} />
    </div>
  );
}
