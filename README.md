# Agronotes

**Cuaderno de campo digital.** App mobile offline-first para que encargados de campo registren tareas agropecuarias (aplicaciones, siembra, cosecha, carga de combustible) en 3 pasos, sin depender de señal.

Reemplaza las libretas de papel y los grupos de WhatsApp que hoy se usan para llevar este registro. Cada tarea se guarda al instante en el dispositivo y se sincroniza sola a un panel web ordenado apenas hay conexión, sin que el operario tenga que hacer nada extra ni perder el registro por falta de señal en el campo.

El panel web le da al administrador una vista consolidada de todo lo que se registra en sus campos: qué se hizo, dónde, cuándo y quién lo cargó, con filtros y exportación a CSV. Se vende por suscripción mensual fija por campo/administrador.

## Capturas de pantalla

*Mockups de la guía visual (paleta y tipografía extraídas del logo), usados para validar el diseño antes de implementarlo en código.*

**Panel web — Login**

![Login del panel web](docs/screenshots/web-login.png)

**Panel web — Dashboard**

![Dashboard del panel web](docs/screenshots/web-dashboard.png)

**Mobile — Login, Home, Nueva tarea, Historial**

![Pantallas de la app mobile](docs/screenshots/mobile-screens.png)

## Stack

- **Backend:** [Supabase](https://supabase.com) (Postgres, autenticación y Row Level Security).
- **Panel web:** [Next.js](https://nextjs.org) (App Router, Server Actions), desplegado en [Vercel](https://vercel.com).
- **App mobile:** [Expo](https://expo.dev) (React Native + Expo Router), con SQLite local para el modo offline.
- **Pagos:** suscripciones por Mercado Pago.

## Estructura del repo

```
apps/
  web/      Panel de administración (Next.js)
  mobile/   App de campo (Expo / React Native)
supabase/   Migraciones y configuración de la base de datos
docs/       Capturas y material de referencia
```

## Desarrollo local

Cada app tiene su propio instructivo de instalación:

- Panel web: `apps/web/README.md`
- App mobile: `apps/mobile/SETUP.md`

Ambas apps se conectan al mismo proyecto de Supabase; las variables de entorno de conexión se configuran por separado en cada una (`.env.local` en `apps/web`, `.env` en `apps/mobile`).

## Distribución de la app mobile

Por el momento la app se distribuye directamente como archivo `.apk` (WhatsApp/email), sin pasar por Google Play. El procedimiento completo está en `apps/mobile/docs/distribucion/generacion-apk.md`.
