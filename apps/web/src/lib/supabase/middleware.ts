import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// apps/web/src/lib/supabase/middleware.ts
//
// Etapa 6 (2026-08-16): además de la protección de rutas de siempre, ahora
// también redirige a un usuario autenticado que **todavía no tiene fila en
// `public.users`** hacia `/crear-organizacion` — es el caso de alguien que
// terminó el alta de organización nueva (`/signup`) y confirmó su email,
// pero no llegó a crear la organización (por ejemplo, cerró la pestaña).
// Sin esto, esa persona quedaría logueada viendo páginas vacías o rotas en
// vez de terminar el paso que le falta.
//
// La consulta a `users` acá agrega una ida a la base en cada request, pero
// es una tabla chica y la policy de SELECT (`organization_id =
// current_org_id()`) hace que, para alguien sin fila, la consulta
// simplemente no devuelva nada — no hay riesgo de error ni de exponer datos
// de otra organización.

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rutas que no requieren sesión. `/legal` son las páginas de política de
  // privacidad, términos y eliminación de cuenta — Google Play exige que la
  // de eliminación de cuenta funcione sin estar logueado.
  const publicPaths = ["/login", "/signup", "/auth", "/update-password", "/legal"];
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (
    user &&
    (request.nextUrl.pathname.startsWith("/login") ||
      request.nextUrl.pathname.startsWith("/signup"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Usuario logueado pero sin organización todavía: lo mandamos a terminar
  // el alta, salvo que ya esté ahí o esté en una ruta pública (no tiene
  // sentido chequear el perfil para esas).
  const skipsProfileCheck =
    isPublicPath || request.nextUrl.pathname.startsWith("/crear-organizacion");

  if (user && !skipsProfileCheck) {
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      const url = request.nextUrl.clone();
      url.pathname = "/crear-organizacion";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
