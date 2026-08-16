import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <div className="rounded-3xl border border-line bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/logo.png" alt="" width={64} height={64} className="mb-4 rounded-2xl" priority />
          <h1 className="text-xl font-extrabold text-brand-900">Agronotes</h1>
          <p className="text-sm font-semibold text-ink-muted">Cuaderno de campo digital</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-sm font-semibold text-ink-muted">
          ¿Sos nuevo?{" "}
          <Link href="/signup" className="font-extrabold text-brand-700 hover:underline">
            Creá tu organización
          </Link>
        </p>
      </div>
    </div>
  );
}
