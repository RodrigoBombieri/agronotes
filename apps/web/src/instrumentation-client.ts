// Inicialización de Sentry del lado del cliente (browser). Next.js carga
// este archivo automáticamente si existe en src/ — no hace falta importarlo
// a mano en ningún lado. Ver sentry.server.config.ts y sentry.edge.config.ts
// para las contrapartes de servidor/edge, registradas desde instrumentation.ts.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.2,
  // Solo activo si hay DSN configurado (queda apagado en local si alguien
  // no tiene el .env.local con la variable cargada).
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
