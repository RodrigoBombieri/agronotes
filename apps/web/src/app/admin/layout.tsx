import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/queries/admin";

// Gate del panel superadmin. Devuelve 404 (no 403/redirect a login) si el
// usuario logueado no está en platform_admins — así alguien que llegue a
// /admin sin permisos no tiene forma de confirmar que la ruta existe.
// No se linkea desde el header normal a propósito, mismo motivo.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isPlatformAdmin(user.id))) {
    notFound();
  }

  return (
    <div className="min-h-full">
      <div className="bg-danger px-4 py-1.5 text-center text-xs font-extrabold uppercase tracking-wide text-white">
        Panel superadmin — solo vos ves esto
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
