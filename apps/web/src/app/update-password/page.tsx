import { UpdatePasswordForm } from "@/components/update-password-form";

export default function UpdatePasswordPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <div className="rounded-3xl border border-line bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-xl font-extrabold text-brand-900">Elegí tu contraseña</h1>
        <p className="mb-6 text-sm font-semibold text-ink-muted">
          Es la primera vez que ingresás, o pediste restablecerla.
        </p>
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
