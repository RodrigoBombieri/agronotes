// supabase/functions/_shared/responses.ts
//
// Forma de respuesta consistente para todos los Edge Functions (Etapa 3,
// decisión "manejo de errores"). El cliente (mobile/web) puede ramificar
// por `error.code` sin tener que parsear mensajes en español.
//
// Códigos usados:
//   VALIDATION_ERROR  -> 400, error del usuario, no se reintenta solo
//   UNAUTHENTICATED   -> 401, falta o expiró el JWT
//   FORBIDDEN         -> 403, autenticado pero sin permiso (ej. no es admin)
//   NOT_FOUND         -> 404
//   CONFLICT          -> 409, ej. invitar un email que ya pertenece a la org
//   SUBSCRIPTION_INACTIVE -> 402, la suscripción no está activa
//   INTERNAL_ERROR    -> 500, error inesperado — este sí es candidato a
//                        reintento automático desde la cola de sync (Etapa 5)

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "SUBSCRIPTION_INACTIVE"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SUBSCRIPTION_INACTIVE: 402,
  INTERNAL_ERROR: 500,
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorResponse(code: ErrorCode, message: string): Response {
  return jsonResponse({ error: { code, message } }, STATUS_BY_CODE[code]);
}
