import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/queries/admin";
import { SignOutButton } from "@/components/sign-out-button";

export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Solo se resuelve (y solo agrega el link) para quien esté en
  // platform_admins — para el resto de los usuarios (la inmensa mayoría)
  // este chequeo devuelve false y el header queda exactamente igual que
  // antes, sin costo visual ni de exponer que la sección existe.
  const showAdminLink = await isPlatformAdmin(user.id);

  return (
    <header className="bg-brand-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5 text-[15px] font-extrabold text-white">
          <Image src="/logo-64.png" alt="" width={28} height={28} className="rounded-lg" priority />
          Agronotes
        </Link>
        <nav aria-label="Navegación principal" className="flex items-center gap-5 text-sm font-bold">
          <Link href="/" className="text-brand-100 hover:text-white">
            Dashboard
          </Link>
          <Link href="/tareas" className="text-brand-100 hover:text-white">
            Tareas
          </Link>
          {showAdminLink && (
            <Link
              href="/admin"
              className="rounded-md bg-danger px-2 py-1 text-white hover:bg-danger/90"
            >
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-semibold text-brand-200 sm:inline">{user.email}</span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
