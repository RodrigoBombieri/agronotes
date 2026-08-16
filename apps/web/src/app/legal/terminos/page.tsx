// apps/web/src/app/legal/terminos/page.tsx — Etapa 6 (2026-08-16).
const LAST_UPDATED = "16 de agosto de 2026";

export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-3xl border border-line bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-extrabold text-brand-900">Términos y condiciones</h1>
        <p className="mb-6 text-xs font-bold text-ink-faint">
          Última actualización: {LAST_UPDATED}
        </p>

        <div className="flex flex-col gap-5 text-sm font-semibold leading-relaxed text-ink">
          <section>
            <h2 className="mb-1.5 text-sm font-extrabold text-brand-800">El servicio</h2>
            <p>
              Agronotes es un cuaderno de campo digital compuesto por una app mobile (para
              registrar tareas desde el campo, incluso sin conexión) y un panel web (para
              administrar campos, lotes, usuarios y ver el historial). Al crear una cuenta,
              aceptás estos términos.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 text-sm font-extrabold text-brand-800">Prueba gratis y suscripción</h2>
            <p>
              Toda organización nueva arranca con 14 días de prueba gratis, sin necesidad de
              cargar una tarjeta. Pasado ese período, para seguir cargando y editando tareas hace
              falta una suscripción activa, con un precio mensual por campo activo. El pago se
              gestiona a través de Mercado Pago, que tiene sus propios términos. Si la suscripción
              vence o se cancela, la organización pasa a modo de solo lectura: se puede seguir
              viendo el historial cargado hasta ese momento, pero no cargar tareas nuevas hasta
              regularizar el pago.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 text-sm font-extrabold text-brand-800">Uso de la cuenta</h2>
            <p>
              Sos responsable de la información que cargás y de mantener segura tu contraseña. Un
              admin de la organización puede invitar y dar de baja usuarios, y administrar los
              campos y lotes. Podés pedir la baja de tu cuenta en cualquier momento (ver la
              página de eliminación de cuenta).
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 text-sm font-extrabold text-brand-800">Disponibilidad</h2>
            <p>
              Hacemos lo posible para que el servicio esté siempre disponible, pero no garantizamos
              disponibilidad ininterrumpida. La app mobile funciona sin conexión y sincroniza los
              datos automáticamente cuando volvés a tener internet.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 text-sm font-extrabold text-brand-800">Cambios a estos términos</h2>
            <p>
              Podemos actualizar estos términos ocasionalmente. Si hacemos un cambio importante,
              te avisamos por email o dentro de la app.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 text-sm font-extrabold text-brand-800">Contacto</h2>
            <p>
              Para cualquier consulta escribinos a{" "}
              <a href="mailto:rodrigosbombieri@gmail.com" className="font-extrabold text-brand-700">
                rodrigosbombieri@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
