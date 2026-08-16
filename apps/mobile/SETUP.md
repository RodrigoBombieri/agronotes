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

## Novedades del 2026-08-16 (Etapa 6) y cómo probarlas

No hace falta instalar nada nuevo: todo está hecho con las dependencias que ya tenías. Sí conviene arrancar con `npx expo start` una vez antes de mirar errores de TypeScript, porque hay una pantalla nueva y Expo Router necesita regenerar sus tipos de rutas (`.expo/types/router.d.ts`, archivo generado que no se commitea).

**Fecha y hora de la tarea.** En el paso 3 del alta ahora hay un selector: atajos "Hoy / Ayer / Anteayer" y dos steppers de −/+ (un día, media hora). Nunca deja elegir una fecha futura. Está hecho a mano en vez de usar el picker nativo para no sumar una dependencia que te obligue a reinstalar Expo Go, y porque los botones grandes se usan mejor en el campo que una rueda.
- Probalo: cargá una tarea con fecha de ayer. Al guardar, Home te avisa que la vas a encontrar en el historial (Home lista solo lo de hoy).

**Editar y anular tareas.** Tocá cualquier tarea en Home o en Historial y se abre la pantalla de edición: lote, tipo, cantidad, unidad, fecha/hora y observación. Abajo está "Anular tarea", que pide confirmación.
- La anulación es un borrado lógico (`deleted_at`), igual que en el panel web: la tarea deja de verse pero no se pierde.
- Funciona offline igual que el alta: se guarda local al instante y queda "pendiente de sincronizar".
- Solo se pueden editar las tareas propias y las que se cargaron en ese mismo celular. Para corregir la tarea de otro está el panel web.
- Probalo offline: modo avión → editá una tarea → tiene que quedar "Pendiente de sincronizar" → salí de modo avión → confirmá en `/tareas` del panel web que el cambio llegó. Repetí con "Anular" y confirmá que desaparece del panel.

**Pull-to-refresh.** En Home y en Historial, tirando la lista hacia abajo se fuerza un ciclo de sincronización. Antes solo se disparaba solo (al abrir la app o al recuperar señal).

**Migración de la base local.** El esquema local pasó a la versión 2 (agrega la columna `deleted_at`). Es automática y no borra nada: la primera vez que abras la app actualizada se aplica sola, con las tareas que ya tenías intactas.

## Qué falta / limitaciones conocidas

- **Lo agregado el 2026-08-16 (fecha/hora, editar, anular, pull-to-refresh) no se probó en pantalla todavía** — está verificado con `tsc --noEmit` limpio y revisado a mano, pero no hay forma de que yo vea cómo renderiza React Native de verdad. Si algo se ve raro (tamaños, espaciados, un botón difícil de tocar con guantes), avisame y lo ajusto.
- Sin tests automatizados.
- `App.tsx` e `index.ts` en la raíz son huérfanos del scaffold original (ya no se usan, el entry point es `expo-router/entry`) — se pueden borrar a mano, igual que `assets/android-icon-monochrome.png` (reemplazado, ya no está referenciado en `app.json`).
- Sin probar en iOS ni en simuladores/emuladores — solo tu Android real.
