// supabase/functions/invite-user/index.ts
//
// Por qué Edge Function y no una función SQL (a diferencia del signup en
// 0004_signup_function.sql): esto necesita la Auth Admin API
// (auth.admin.inviteUserByEmail), que solo existe del lado del servidor
// con la service role key — no hay forma de hacerlo desde una función de
// Postgres. Coincide con el criterio de planificador.md Etapa 3: Edge
// Functions solo para lo que no es CRUD simple.
//
// Body esperado: { "email": string, "fullName"?: string, "role"?: "admin"|"operario" }
// Header requerido: Authorization: Bearer <jwt del usuario que invita>
//
// Deploy: supabase functions deploy invite-user
// Variables de entorno (ya provistas automáticamente por Supabase en
// runtime, no hace falta configurarlas a mano):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/responses.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return errorResponse("VALIDATION_ERROR", "Método no soportado, usar POST");
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return errorResponse("UNAUTHENTICATED", "Falta el header Authorization");
  }

  // Cliente "as user": valida el JWT tal cual lo haría cualquier query
  // normal del cliente, respetando RLS. Lo usamos solo para identificar
  // quién llama, nunca para las escrituras privilegiadas de abajo.
  const asUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: authData, error: authError } = await asUser.auth.getUser();
  if (authError || !authData?.user) {
    return errorResponse("UNAUTHENTICATED", "Token inválido o expirado");
  }
  const callerId = authData.user.id;

  // Cliente con service role: bypasea RLS a propósito, solo para las
  // operaciones que este endpoint tiene explícitamente permitido hacer.
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: callerProfile, error: callerProfileError } = await admin
    .from("users")
    .select("organization_id, role")
    .eq("id", callerId)
    .single();

  if (callerProfileError || !callerProfile) {
    return errorResponse("FORBIDDEN", "El usuario que invita no pertenece a ninguna organización");
  }
  if (callerProfile.role !== "admin") {
    return errorResponse("FORBIDDEN", "Solo un admin puede invitar usuarios");
  }

  const { data: subscription } = await admin
    .from("subscriptions")
    .select("status")
    .eq("organization_id", callerProfile.organization_id)
    .single();

  if (subscription && ["past_due", "canceled"].includes(subscription.status)) {
    return errorResponse(
      "SUBSCRIPTION_INACTIVE",
      "La suscripción no está activa, no se pueden invitar nuevos usuarios",
    );
  }

  let body: { email?: string; fullName?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("VALIDATION_ERROR", "Body inválido, se esperaba JSON");
  }

  const email = body.email?.trim().toLowerCase();
  const role = body.role ?? "operario";
  const fullName = body.fullName?.trim() || null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return errorResponse("VALIDATION_ERROR", "Email inválido");
  }
  if (role !== "admin" && role !== "operario") {
    return errorResponse("VALIDATION_ERROR", "role debe ser 'admin' u 'operario'");
  }

  const { data: existing } = await admin
    .from("users")
    .select("id")
    .eq("email", email)
    .eq("organization_id", callerProfile.organization_id)
    .maybeSingle();

  if (existing) {
    return errorResponse("CONFLICT", "Ese email ya pertenece a un usuario de esta organización");
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email);

  if (inviteError || !invited?.user) {
    return errorResponse("INTERNAL_ERROR", inviteError?.message ?? "No se pudo enviar la invitación");
  }

  const { error: insertError } = await admin.from("users").insert({
    id: invited.user.id,
    organization_id: callerProfile.organization_id,
    email,
    full_name: fullName,
    role,
  });

  if (insertError) {
    // el usuario de auth ya se creó — no lo revertimos automáticamente
    // (evitar borrar un auth.users por una falla transitoria); queda
    // para revisión manual si esto llega a pasar.
    return errorResponse("INTERNAL_ERROR", `Invitación enviada pero falló el alta en users: ${insertError.message}`);
  }

  return jsonResponse({ userId: invited.user.id, email, role }, 201);
});
