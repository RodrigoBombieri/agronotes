# Setup — Agronotes mobile (Etapa 5)

Código base de la app mobile (React Native + Expo, TypeScript, Expo Router). Escrito sin poder correr un simulador ni Expo real desde este entorno — `tsc`/`eslint` no se pudieron correr limpio acá (ver "Limitaciones" abajo), así que la primera pasada real la tenés que hacer vos, siguiendo estos pasos.

## 1. Limpiar `node_modules` antes de instalar

Al armar este proyecto intenté correr `npx create-expo-app` y `npm install` desde mi entorno (sandbox Linux) contra esta misma carpeta, y quedó una `node_modules/` a medio instalar y corrupta (quedaron archivos con permisos raros que ni yo pude borrar). **Antes de instalar nada, borrá a mano la carpeta `apps/mobile/node_modules` desde el Explorador de Windows** (no hace falta terminal, la carpeta entera) y también `apps/mobile/package-lock.json` si existe.

## 2. Instalar dependencias

Desde `apps/mobile/`:

```
npm install
npx expo install expo-router expo-sqlite expo-crypto expo-linking expo-constants react-native-safe-area-context react-native-screens @supabase/supabase-js @react-native-async-storage/async-storage @react-native-community/netinfo react-native-url-polyfill
```

`npx expo install` (no `npm install <paquete>`) es importante: resuelve automáticamente la versión de cada paquete compatible con este SDK de Expo exacto, en vez de instalar el último `latest` a secas.

## 3. Variables de entorno

```
cp .env.example .env
```

Completá `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con el mismo publishable key que ya está en `apps/web/.env.local` (mismo proyecto Supabase, `eccilswknqnwseyllsda`).

## 4. Correr la app

```
npx expo start
```

Te va a mostrar un QR. Instalá **Expo Go** en tu celular (App Store / Play Store) y escaneálo — la app se abre ahí mismo, sin compilar nada nativo. Cada cambio de código se refleja solo (hot reload).

Si algo no anda al toque, corré `npx expo-doctor` — valida que `app.json`/`package.json` estén coherentes entre sí, cosa que yo no pude verificar acá.

## 5. Cómo probar lo importante (offline + sync)

1. Iniciá sesión con un usuario que ya exista en el proyecto Supabase (el mismo que usás en el panel web).
2. Activá **modo avión** en el celular.
3. Tocá "+ Nueva tarea", completá los 3 pasos y guardá — tiene que guardarse igual, sin ningún error ni bloqueo (ese es el requisito no negociable de Etapa 1).
4. En Home vas a ver la tarea con la etiqueta "Pendiente de sincronizar" y el indicador de arriba en naranja.
5. Desactivá modo avión. El indicador debería pasar a "Sincronizando…" solo (no hace falta reabrir la app) y después a "Todo sincronizado". Confirmá en el panel web (`/tareas`) que la tarea llegó.

## 6. Qué falta / limitaciones conocidas

- **No probado en ningún simulador ni dispositivo real todavía** — este entorno no tiene Xcode/Android Studio ni tu celular. `tsc`/`eslint` tampoco se pudieron correr acá (ver más abajo). Es el primer código de Etapa 5 sin ese nivel de verificación que sí tuvo Etapa 3/4.
- No hay edición ni anulación de tareas desde el mobile — solo alta. Editar/anular ya funciona desde el panel web.
- La fecha de la tarea siempre es "ahora" (no hay selector de fecha/hora todavía) — para cargar algo de un día anterior, por ahora hay que hacerlo desde el panel.
- Sin pull-to-refresh manual en Home/Historial (si hace falta, se agrega fácil).
- Sin tests automatizados.
- `App.tsx` e `index.ts` en la raíz quedaron huérfanos (el scaffold original de Expo) — ya no se usan, el entry point ahora es `expo-router/entry` vía `package.json`. Se pueden borrar a mano.

## Por qué no se pudo verificar desde acá

Intenté instalar el proyecto completo en mi entorno para correr `tsc --noEmit` y `eslint` como hice con el panel web (Etapa 4), pero `npm install`/`create-expo-app` se colgaron repetidamente instalando las dependencias nativas de Expo/React Native (mucho más pesadas que las de Next.js) y terminaron corrompiendo `node_modules` a medio camino. Después de varios intentos preferí escribir el código a mano con cuidado (basado en la documentación oficial vigente de Expo Router, expo-sqlite y Supabase para React Native, que sí pude consultar) en vez de seguir perdiendo tiempo contra el entorno. Por eso este código no tiene el mismo nivel de verificación automática que tuvo el panel web — la prueba real te queda a vos con los pasos de arriba.
