# Setup — Agronotes mobile (Etapa 5)

Código base de la app mobile (React Native + Expo SDK 54, TypeScript, Expo Router). Ya la instalaste y probaste una vez con éxito (flujo offline→sync confirmado en tu Android real) — esta actualización solo suma el rediseño visual (paleta del logo + tipografía Nunito), no vuelve a tocar la base.

## Si ya tenés el proyecto corriendo (caso normal)

Solo hace falta instalar las dos librerías nuevas que usa el rediseño para cargar la fuente Nunito y controlar el splash screen:

```
npx expo install expo-font expo-splash-screen @expo-google-fonts/nunito
```

No hace falta borrar `node_modules` esta vez — son paquetes nuevos, no un cambio de SDK. Después:

```
npx expo start
```

Y volvé a abrir la app en Expo Go. Deberías ver: ícono nuevo (el logo del cuaderno) en vez del ícono genérico de Expo, colores verdes/madera en vez de blanco y negro, y la tipografía Nunito (más redondeada) en vez de la fuente del sistema.

## Si es la primera vez que lo instalás (setup completo desde cero)

1. Borrá `node_modules` y `package-lock.json` si existen (Explorador de Windows, no hace falta terminal).
2. Desde `apps/mobile/`:
   ```
   npm install
   npx expo install expo-router expo-sqlite expo-crypto expo-linking expo-constants expo-font expo-splash-screen @expo-google-fonts/nunito react-native-safe-area-context react-native-screens @supabase/supabase-js @react-native-async-storage/async-storage @react-native-community/netinfo react-native-url-polyfill
   ```
3. `cp .env.example .env` y completá `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (mismo valor que en `apps/web/.env.local`).
4. `npx expo start`, escaneá el QR con **Expo Go** (Play Store — la versión de las tiendas quedó fija en SDK 54 hace meses, por eso el proyecto está en esa versión, no en la última).

## Cómo probar lo importante (offline + sync)

1. Iniciá sesión con un usuario que ya exista en el proyecto Supabase.
2. Activá **modo avión**.
3. Tocá "+ Nueva tarea", completá los 3 pasos y guardá — tiene que guardarse igual, sin bloqueo.
4. En Home vas a ver la tarea con la etiqueta "Pendiente de sincronizar" y el indicador arriba en color mostaza.
5. Desactivá modo avión. El indicador pasa a "Sincronizando…" solo y después a "Todo sincronizado". Confirmá en el panel web (`/tareas`) que llegó.

## Qué falta / limitaciones conocidas

- **El rediseño no se probó en pantalla todavía** — lo armé siguiendo al pixel la guía visual que aprobaste (mismos hex, misma fuente), verificado por lectura de código, pero no hay forma de que yo vea cómo renderiza React Native de verdad. Si algo se ve raro (tamaños, espaciados, algún color que no contraste bien al sol), avisame y lo ajusto.
- No hay edición ni anulación de tareas desde el mobile — solo alta. Ya funciona desde el panel web.
- La fecha de la tarea siempre es "ahora" (sin selector de fecha/hora todavía).
- Sin pull-to-refresh manual en Home/Historial.
- Sin tests automatizados.
- `App.tsx` e `index.ts` en la raíz son huérfanos del scaffold original (ya no se usan, el entry point es `expo-router/entry`) — se pueden borrar a mano, igual que `assets/android-icon-monochrome.png` (reemplazado, ya no está referenciado en `app.json`).
- Sin probar en iOS ni en simuladores/emuladores — solo tu Android real.
