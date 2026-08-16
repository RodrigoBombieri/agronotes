"use client";

import { useActionState, useRef } from "react";
import { initialActionState, type ActionState } from "@/lib/actions/types";
import { requestAccountDeletion } from "@/lib/actions/account-deletion";

// apps/web/src/components/account-deletion-form.tsx — Etapa 6
// (2026-08-16). Página pública (no requiere sesión), ver
// app/legal/eliminar-cuenta/page.tsx. Mismo patrón "envolver la acción
// para resetear el form al salir bien" que catalog-forms.tsx.
export function AccountDeletionForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await requestAccountDeletion(prev, formData);
      if (result.ok) formRef.current?.reset();
      return result;
    },
    initialActionState,
  );

  if (state.ok && !state.error) {
    return (
      <div
        role="status"
        className="rounded-2xl border-2 border-line bg-cream p-4 text-sm font-semibold text-ink"
      >
        Recibimos tu pedido. Vamos a eliminar tu cuenta y los datos asociados en los próximos
        días hábiles, y te avisamos por mail cuando esté listo.
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-bold text-ink">
          Email de tu cuenta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-xl border-2 border-line bg-cream px-3 py-2.5 text-[15px] font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reason" className="text-sm font-bold text-ink">
          Motivo (opcional)
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          maxLength={500}
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
        className="mt-1 rounded-xl bg-danger px-3 py-2.5 text-[15px] font-extrabold text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Pedir eliminación de mi cuenta"}
      </button>
    </form>
  );
}
