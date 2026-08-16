// Registra las inicializaciones de Sentry de servidor/edge según el
// runtime en el que corre Next.js, y conecta la captura automática de
// errores no manejados en Server Components/Route Handlers.

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
