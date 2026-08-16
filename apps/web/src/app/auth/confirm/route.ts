import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // `next` viene del `emailRedirectTo` que arma cada flujo que dispara un
  // mail de confirmación (ver signup-form.tsx, que manda
  // `?next=/crear-organizacion`) — Supabase preserva esa query string y la
  // reenvía acá junto con token_hash/type. Si no viene (por ejemplo, un
  // link de invitación o de recuperación armado sin ese parámetro), se usa
  // el valor por defecto de siempre según el tipo de confirmación.
  const explicitNext = searchParams.get("next");
  const next =
    explicitNext ?? (type === "recovery" || type === "invite" ? "/update-password" : "/");

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link_invalido`);
}
