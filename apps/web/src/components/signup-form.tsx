"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// apps/web/src/components/signup-form.tsx — Etapa 6 (2026-08-16).
//
// Alta de una persona nueva (todavía sin organización). Solo crea el
// usuario en `auth.users` vía `supabase.auth.signUp` — crear la fila en
// `public.users` y la organización es un paso aparte (`/crear-organizacion`,
// RPC `create_organization_and_owner`), porque `auth.users` no tiene
// trigger que lo haga automáticamente (confirmado por SQL, ver
// planificador.md Etapa 6).
//
// Hay dos caminos posibles después de `signUp`, según si el proyecto de
// Supabase tiene la confirmación de email activada o no:
//   1. Confirmación activada (lo normal en producción): `data.session` viene
//      `null`, hay que avisarle a la persona que revise su correo. El link
//      del mail apunta a `auth/confirm`, que redirige a `/crear-organizacion`.
//   2. Confirmación desactivada (por ejemplo, en desarrollo): `data.session`
//      viene con valor, ya queda logueada — la mandamos directo a
//      `/crear-organizacion`.
export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/crear-organizacion`,
      },
    });
    setLoading(false);

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes("already registered")) {
        setError("Ese email ya tiene una cuenta. Probá iniciar sesión.");
      } else {
        setError("No se pudo crear la cuenta. Revisá los datos e intentá de nuevo.");
      }
      return;
    }

    if (data.session) {
      router.push("/crear-organizacion");
      router.refresh();
      return;
    }

    setCheckEmail(true);
  }

  if (checkEmail) {
    return (
      <div className="rounded-2xl border-2 border-line bg-cream p-4 text-sm font-semibold text-ink">
        Te mandamos un email a <span className="font-extrabold">{email}</span> para confirmar la
        cuenta. Abrí el link que te llega para terminar el alta de tu organización.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-bold text-ink">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-xl border-2 border-line bg-cream px-3 py-2.5 text-[15px] font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-bold text-ink">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-xl border-2 border-line bg-cream px-3 py-2.5 text-[15px] font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-bold text-ink">
          Repetí la contraseña
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="rounded-xl border-2 border-line bg-cream px-3 py-2.5 text-[15px] font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm font-bold text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 rounded-xl bg-brand-900 px-3 py-2.5 text-[15px] font-extrabold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "Creando cuenta…" : "Crear cuenta"}
      </button>
    </form>
  );
}
