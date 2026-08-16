"use client";

import { useActionState } from "react";
import { initialActionState } from "@/lib/actions/types";
import { createOrganization } from "@/lib/actions/organization";

// apps/web/src/components/create-organization-form.tsx — Etapa 6
// (2026-08-16). Server Action directo, sin envoltorio: acá no hace falta
// "limpiar" nada al terminar porque el éxito redirige a "/" (ver
// organization.ts) — el patrón useCreateForm/useRowEditor de
// catalog-forms.tsx es para formularios que se quedan en la misma página.
export function CreateOrganizationForm() {
  const [state, formAction, pending] = useActionState(createOrganization, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="orgName" className="text-sm font-bold text-ink">
          Nombre de tu organización
        </label>
        <input
          id="orgName"
          name="orgName"
          type="text"
          autoComplete="organization"
          required
          maxLength={120}
          placeholder="Ej: Establecimiento Los Alamos"
          className="rounded-xl border-2 border-line bg-cream px-3 py-2.5 text-[15px] font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm font-bold text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-xl bg-brand-900 px-3 py-2.5 text-[15px] font-extrabold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Creando…" : "Crear organización"}
      </button>
    </form>
  );
}
