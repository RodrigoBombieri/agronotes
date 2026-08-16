import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/queries/admin";
import { getSubscriptionBannerInfo } from "@/lib/queries/subscription";
import { SignOutButton } from "@/components/sign-out-button";

const INACTIVE_STATUSES = new Set(["past_due", "canceled"]);

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
  const [showAdminLink, subscriptionBanner] = await Promise.all([
    isPlatformAdmin(user.id),
    getSubscriptionBannerInfo(supabase),
  ]);

  // Modo solo lectura (Etapa 6, 2026-08-16): si la suscripción de la
  // organización está vencida o cancelada, se avisa en todas las páginas
  // — el bloqueo real de escritura ya lo hace RLS del lado del servidor
  // (ver migración readonly_mode_inactive_subscription), esto es solo
  // para que quede claro por qué un guardado puede fallar.
  const showInactiveBanner =
    subscriptionBanner !== null && INACTIVE_STATUSES.has(subscriptionBanner.status);

  return (
    <>
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
            <Link href="/suscripcion" className="text-brand-100 hover:text-white">
              Suscripción
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
      {showInactiveBanner && subscriptionBanner && (
        <div className="bg-danger px-4 py-2 text-center text-sm font-bold text-white">
          {subscriptionBanner.status === "past_due"
            ? "El pago de tu suscripción está vencido."
            : "Tu suscripción está cancelada."}{" "}
          {subscriptionBanner.isAdmin ? (
            <>
              No se pueden cargar ni editar tareas, campos ni lotes hasta regularizarla —{" "}
              <Link href="/suscripcion" className="underline underline-offset-2">
                ir a Suscripción
              </Link>
              .
            </>
          ) : (
            "No se pueden cargar ni editar tareas hasta que el admin la regularice."
          )}
        </div>
      )}
    </>
  );
}
