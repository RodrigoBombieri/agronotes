import Image from "next/image";
import Link from "next/link";
import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
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
          <h1 className="text-xl font-extrabold text-brand-900">Creá tu cuenta</h1>
          <p className="text-sm font-semibold text-ink-muted">
            Empezá gratis, 14 días de prueba sin tarjeta.
          </p>
        </div>
        <SignupForm />
        <p className="mt-6 text-center text-sm font-semibold text-ink-muted">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-extrabold text-brand-700 hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
