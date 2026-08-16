"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// apps/web/src/components/subscribe-button.tsx
//
// Llama a la Edge Function create-subscription (Etapa 6, 2026-08-16) y
// redirige al usuario a la URL de checkout de Mercado Pago que devuelve.
// La confirmación real de que el pago se completó llega después, de forma
// asíncrona, vía el webhook — por eso acá no hay ningún estado de "éxito",
// solo el redirect.

type CreateSubscriptionResponse = { checkoutUrl?: string };
type ErrorBody = { error?: { message?: string } };

export function SubscribeButton({ disabled }: { disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const backUrl = `${window.location.origin}/suscripcion?resultado=ok`;

    const { data, error: invokeError } = await supabase.functions.invoke<CreateSubscriptionResponse>(
      "create-subscription",
      { body: { backUrl } },
    );

    if (invokeError) {
      let message = "No se pudo iniciar la suscripción. Probá de nuevo en un momento.";
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

    if (!data?.checkoutUrl) {
      setError("Mercado Pago no devolvió una URL de pago. Probá de nuevo en un momento.");
      setLoading(false);
      return;
    }

    window.location.href = data.checkoutUrl;
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className="rounded-xl bg-brand-900 px-4 py-2.5 text-[15px] font-extrabold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "Redirigiendo a Mercado Pago…" : "Suscribirme"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm font-bold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
