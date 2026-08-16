import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { CreateOrganizationForm } from "@/components/create-organization-form";

// apps/web/src/app/crear-organizacion/page.tsx — Etapa 6 (2026-08-16).
//
// Paso final del alta: la persona ya tiene cuenta en `auth.users` (vino de
// `/signup` y, si corresponde, confirmó el mail) pero todavía no tiene fila
// en `public.users` ni organización. Si ya la tiene —por ejemplo, volvió a
// esta URL después de haber terminado el alta antes—, la mandamos directo
// al panel en vez de mostrar el formulario de nuevo.
export default async function CrearOrganizacionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <div className="rounded-3xl border border-line bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt=""
            width={64}
            height={64}
            className="mb-4 rounded-2xl"
            priority
          />
          <h1 className="text-xl font-extrabold text-brand-900">Ya casi está</h1>
          <p className="text-sm font-semibold text-ink-muted">
            Un último paso: dale un nombre a tu organización.
          </p>
        </div>
        <CreateOrganizationForm />
      </div>
    </div>
  );
}
