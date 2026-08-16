// apps/web/src/app/legal/privacidad/page.tsx — Etapa 6 (2026-08-16).
// Página pública, sin sesión. Contenido estático a propósito: no hay
// necesidad de traerlo de la base para una app de este tamaño, y así se
// evita que dependa de que la base esté arriba.
const LAST_UPDATED = "16 de agosto de 2026";

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-3xl border border-line bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-extrabold text-brand-900">Política de privacidad</h1>
        <p className="mb-6 text-xs font-bold text-ink-faint">
          Última actualización: {LAST_UPDATED}
        </p>

        <div className="flex flex-col gap-5 text-sm font-semibold leading-relaxed text-ink">
          <section>
            <h2 className="mb-1.5 text-sm font-extrabold text-brand-800">¿Qué es Agronotes?</h2>
            <p>
              Agronotes es un cuaderno de campo digital: una app mobile y un panel web que usan
              organizaciones agropecuarias para registrar las tareas que se hacen en sus campos
              (siembra, aplicaciones, cosecha, etc.). Esta política explica qué datos personales
              recolectamos, para qué los usamos y qué derechos tenés sobre ellos.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 text-sm font-extrabold text-brand-800">Qué datos recolectamos</h2>
            <p>
              Cuando creás una cuenta guardamos tu email y, si lo cargás, tu nombre. Cuando
              trabajás con la app guardamos los registros de tareas de campo que cargás: tipo de
              tarea, lote, campo, cantidad, unidad, fecha y notas opcionales que escribas. No
              accedemos a tu ubicación GPS, cámara ni contactos del teléfono. Si administrás la
              suscripción de tu organización, Mercado Pago procesa el pago de forma directa — no
              vemos ni guardamos números de tarjeta.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 text-sm font-extrabold text-brand-800">Para qué usamos tus datos</h2>
            <p>
              Usamos tus datos únicamente para que la app funcione: mostrarte y sincronizar las
              tareas de tu organización, identificarte al iniciar sesión, y administrar la
              suscripción. No vendemos datos a terceros ni los usamos para publicidad — Agronotes
              no tiene publicidad.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 text-sm font-extrabold text-brand-800">Con quién los compartimos</h2>
            <p>
              Guardamos los datos en Supabase (infraestructura de base de datos y autenticación),
              que actúa como encargado del tratamiento. Los pagos de la suscripción los procesa
              Mercado Pago, con su propia política de privacidad. No compartimos tus datos con
              nadie más.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 text-sm font-extrabold text-brand-800">Tus derechos</h2>
            <p>
              Podés pedirnos en cualquier momento que eliminemos tu cuenta y tus datos personales
              desde{" "}
              <a href="/legal/eliminar-cuenta" className="font-extrabold text-brand-700 hover:underline">
                esta página
              </a>
              , o escribiéndonos directamente. Las tareas de campo que cargaste quedan como
              registro histórico de tu organización, pero tus datos personales (nombre, email) se
              eliminan de nuestros sistemas.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 text-sm font-extrabold text-brand-800">Contacto</h2>
            <p>
              Para cualquier consulta sobre esta política o tus datos, escribinos a{" "}
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
