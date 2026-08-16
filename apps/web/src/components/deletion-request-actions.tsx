"use client";

import { useActionState } from "react";
import { initialActionState } from "@/lib/actions/types";
import { markDeletionRequestDone } from "@/lib/actions/account-deletion";

// apps/web/src/components/deletion-request-actions.tsx — Etapa 6
// (2026-08-16). Botón para marcar un pedido de eliminación de cuenta como
// resuelto, en /admin. `markDeletionRequestDone` hace `revalidatePath` así
// que la fila desaparece sola de la lista de "pendientes" al confirmar.
export function MarkDoneButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(
    markDeletionRequestDone,
    initialActionState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg px-2 py-1 text-xs font-extrabold text-brand-700 hover:bg-brand-50 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Marcar resuelto"}
      </button>
      {state.error && (
        <p role="alert" className="mt-1 text-xs font-bold text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
