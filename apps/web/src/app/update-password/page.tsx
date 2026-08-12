import { UpdatePasswordForm } from "@/components/update-password-form";

export default function UpdatePasswordPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-2 text-xl font-semibold">Elegí tu contraseña</h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        Es la primera vez que ingresás, o pediste restablecerla.
      </p>
      <UpdatePasswordForm />
    </div>
  );
}
