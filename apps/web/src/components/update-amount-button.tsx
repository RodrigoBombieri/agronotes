"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// apps/web/src/components/update-amount-button.tsx
//
// Llama a la Edge Function update-subscription-amount (Etapa 6,
// 2026-08-16) para que el monto contratado en Mercado Pago coincida con la
// cantidad de campos activos actual. Recálculo manual, a pedido del admin
// — ver la nota en la propia Edge Function sobre por qué no es automático.

type ErrorBody = { error?: { message?: string } };

export function UpdateAmountButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: invokeError } = await supabase.functions.invoke("update-subscription-amount");

    if (invokeError) {
      let message = "No se pudo actualizar el monto. Probá de nuevo en un momento.";
      const context = (invokeError as { context?: Response }).context;
      if (context) {
        try {
          const body = (await context.json()) as ErrorBody;
          if (body?.error?.message) message = body.error.message;
        } catch {
          // Respuesta sin JSON válido, nos quedamos con el mensaje genérico.
        }
      }
      setError(message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-lg border border-brand-700 bg-white px-3 py-1.5 text-sm font-bold text-brand-900 hover:bg-brand-50 disabled:opacity-60"
      >
        {loading ? "Actualizando…" : "Actualizar monto"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm font-bold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
