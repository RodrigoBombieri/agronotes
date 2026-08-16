import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Cliente con la service role key — bypassea RLS por completo. SOLO se
// importa desde código que corre en el servidor (Server Components / Route
// Handlers dentro de app/admin/), nunca desde un componente cliente. La key
// vive en SUPABASE_SERVICE_ROLE_KEY (sin prefijo NEXT_PUBLIC_, por lo que
// Next.js nunca la incluye en el bundle que llega al browser). Rodrigo
// tiene que cargarla a mano en .env.local (Supabase Dashboard → Settings →
// API → service_role key) — no está seteada por defecto.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
