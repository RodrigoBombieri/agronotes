// Inicialización de Sentry del lado del servidor (Node runtime). Registrado
// desde instrumentation.ts — no se importa a mano en otro lado.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.2,
  enabled: Boolean(process.env.SENTRY_DSN),
});
