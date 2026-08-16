import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

// Org/project/authToken quedan sin configurar hasta que Rodrigo los defina
// (Settings del proyecto en sentry.io) — sin ellos, el build simplemente no
// sube source maps a Sentry (no falla, solo los stack traces en producción
// llegan sin símbolos). El reporte de errores en sí ya funciona con el DSN
// solo (ver src/instrumentation-client.ts, sentry.server.config.ts,
// sentry.edge.config.ts).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
});
