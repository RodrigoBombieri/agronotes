import Link from "next/link";

// apps/web/src/components/app-footer.tsx — Etapa 6 (2026-08-16).
//
// Enlaces a las páginas legales públicas. Están acá (y no solo en algún
// menú interno) porque Google Play pide que la página de eliminación de
// cuenta sea fácil de encontrar, y porque estas páginas tienen que ser
// accesibles sin sesión — un footer visible en toda la app, logueado o no,
// es la forma más directa de cumplir eso.
export function AppFooter() {
  return (
    <footer className="border-t border-line px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-bold text-ink-faint">
        <span>© {new Date().getFullYear()} Agronotes</span>
        <Link href="/legal/privacidad" className="hover:text-brand-700 hover:underline">
          Privacidad
        </Link>
        <Link href="/legal/terminos" className="hover:text-brand-700 hover:underline">
          Términos
        </Link>
        <Link href="/legal/eliminar-cuenta" className="hover:text-brand-700 hover:underline">
          Eliminar cuenta
        </Link>
      </div>
    </footer>
  );
}
