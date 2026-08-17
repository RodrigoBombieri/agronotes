# Generación y distribución del APK — instructivo detallado

Este documento describe, paso a paso, cómo generar el instalador (`.apk`)
de Agronotes para Android y distribuirlo directamente a los usuarios
(WhatsApp o email), sin pasar por Google Play. Es el mecanismo de
distribución actual del producto (decisión del 2026-08-16, ver
`google-play-checklist.md` para el contexto y el camino alternativo de
publicar en la tienda más adelante).

## 1. Por qué un `.apk` y no un `.aab`

Google Play solo acepta y solo sabe instalar archivos `.aab` (Android App
Bundle). Un `.apk` es el formato clásico, instalable a mano en cualquier
Android sin pasar por una tienda. El profile `standalone` de `eas.json`
está configurado para generar `.apk` explícitamente:

```json
"standalone": {
  "distribution": "internal",
  "autoIncrement": true,
  "android": { "buildType": "apk" },
  "channel": "standalone"
}
```

Este profile convive con `preview` (pruebas internas) y `production`
(reservado para el día que se retome Google Play) — no hace falta tocar
ninguno de los otros.

## 2. Prerrequisitos (una sola vez)

1. **Cuenta de Expo** (gratuita) en https://expo.dev — es la cuenta que
   usa EAS Build para compilar en la nube, y **no tiene relación** con la
   cuenta de Google Play ni con Mercado Pago. Si no la tenés, se crea
   sola la primera vez que hacés login desde la terminal.
2. **`eas-cli` instalado.** No hace falta instalarlo global: se puede
   correr con `npx eas-cli <comando>` cada vez, que es lo que se usa en
   este instructivo.
3. **Login:**
   ```bash
   cd apps/mobile
   npx eas-cli login
   ```
   Pide el email/usuario y contraseña de la cuenta de Expo del punto 1.
4. **Vincular el proyecto (solo la primera vez que se usa EAS en este
   repo):**
   ```bash
   npx eas-cli init
   ```
   Esto crea/vincula un `projectId` de Expo con el proyecto y lo guarda en
   `app.json`. Si ya está vinculado, el comando lo detecta solo y no hace
   falta repetirlo en builds futuros.

## 3. Generar el APK

Desde `apps/mobile/`:

```bash
npx eas-cli build --platform android --profile standalone
```

El build corre en la nube (servidores de Expo), no en tu máquina — la
terminal se queda esperando y muestra el progreso. Cuando termina
(normalmente 10-20 minutos), imprime un link a la página del build
(`expo.dev/accounts/.../builds/<id>`) con un **QR** y un botón de
**Install**.

**Cómo bajarlo al celular:**
- Escaneá el QR directo desde la cámara del Android (te lleva a esa
  página), o abrí el link en el navegador del celular.
- Tocá **Install** — descarga el `.apk`.
- Al abrir el archivo descargado, Android va a mostrar un aviso de
  **"No se permite instalar apps de esta fuente"** (o similar) la primera
  vez — es esperado, no es un error. Hay que ir a Configuración, permitir
  la instalación desde esa fuente (el navegador o la app de archivos que
  se esté usando), volver atrás y confirmar **Instalar**.
- Este mismo link de descarga se le puede reenviar directo a cualquier
  usuario (WhatsApp, email) sin que tenga que escanear nada — junto con
  el instructivo de instalación (`instructivo-instalacion-agronotes.pdf`,
  en esta misma carpeta), pensado para mandarle tal cual a alguien sin
  conocimientos técnicos.

## 4. Errores conocidos y cómo resolverlos

### "Unknown error" sin más detalle al fallar el build

El mensaje típico es:
```
🤖 Android build failed: Unknown error. See logs of the Install
dependencies build phase for more information.
```
El link que da el CLI (`expo.dev/.../builds/<id>`) requiere estar
logueado en el navegador con la misma cuenta de Expo para ver los logs
completos. Entrá ahí, abrí la fase **"Install dependencies"** y buscá el
error real más abajo en el log (suele estar varias líneas después del
resumen).

### Error de npm: `ERESOLVE could not resolve` (conflicto de `react-dom`)

Síntoma (aparece en la fase "Install dependencies"):
```
npm error code ERESOLVE
npm error ERESOLVE could not resolve
npm error While resolving: react-dom@19.2.8
npm error Found: react@19.1.0
...
npm error peer react@"^19.2.8" from react-dom@19.2.8
```

**Causa:** `expo-router` incluye internamente paquetes de UI web
(`@radix-ui/*`, `vaul`) que declaran `react-dom` como dependencia
obligatoria (peer dependency no-opcional). npm intenta instalar la
última versión de `react-dom`, que pide una versión de `react` más nueva
que la que usa el proyecto (fijada por compatibilidad con la versión de
React Native instalada) — y ahí choca.

**Solución:** crear (si no existe) `apps/mobile/.npmrc` con:
```
legacy-peer-deps=true
```
Esto hace que npm resuelva dependencias con el comportamiento más laxo de
versiones anteriores (no fuerza a instalar/chequear peer dependencies
obligatorias). Es seguro en este caso porque esos paquetes de UI web
nunca se usan desde el código nativo de la app y no terminan empaquetados
en el build final.

Después de crear el archivo, conviene verificar en limpio antes de
reintentar el build:
```bash
cd apps/mobile
# borrar node_modules y package-lock.json (a mano o con rm -rf)
npm install
npm ci --include=dev   # tiene que terminar sin errores
```
Commiteá `.npmrc` y el `package-lock.json` regenerado, y volvé a correr
`eas build`.

## 5. Generar una nueva versión (actualización)

Cada vez que haya cambios para repartir:

1. (Opcional pero recomendado) Subí el número de versión visible en
   `app.json` → `expo.version` (por ejemplo de `1.0.0` a `1.0.1`), para
   que el usuario pueda distinguir qué versión tiene instalada si alguna
   vez hay dudas.
2. Volvé a correr el mismo comando de build:
   ```bash
   cd apps/mobile
   npx eas-cli build --platform android --profile standalone
   ```
   El `versionCode` interno de Android se incrementa solo en cada build
   gracias a `"autoIncrement": true` en el profile — no hace falta
   tocarlo a mano, y evita el error de Android que rechaza instalar un
   `.apk` con el mismo `versionCode` que uno ya instalado.
3. Cuando termine, repetí la distribución del punto 3: bajar el nuevo
   `.apk` y reenviarlo a cada usuario. **Instalarlo encima del anterior
   actualiza la app sin perder los datos** (mismo `android.package`,
   Android lo trata como una actualización, no una instalación nueva).

## 6. Limitaciones de este modelo (a tener en cuenta)

- **No hay actualizaciones automáticas.** A diferencia de una app
  instalada desde Google Play, el usuario no recibe avisos de que hay una
  versión nueva — hay que generar el `.apk` y reenviarlo manualmente cada
  vez. Manejable mientras la cantidad de usuarios sea chica.
- **Advertencia de "origen desconocido"** en cada instalación/actualización
  nueva de un dispositivo que nunca instaló el APK antes — normal, cubierto
  en el instructivo para el usuario final.
- **Quedó pendiente, explícitamente pospuesto para más adelante:**
  automatizar las actualizaciones con `expo-updates` (permite empujar
  cambios de JS sin generar un `.apk` nuevo ni reinstalar nada, para
  cambios que no toquen código nativo). No se implementa hasta que se
  pida directamente.
- Las páginas legales (privacidad, términos, eliminación de cuenta) y la
  opción de eliminar la cuenta desde la app siguen vigentes y son buena
  práctica igual, más allá de no pasar por Google Play.

## 7. Si en el futuro se retoma Google Play

Toda la configuración para publicar en la tienda (package id en
`app.json`, profile `production` y `submit.production.android` en
`eas.json`, assets gráficos en `apps/mobile/docs/play-store/`) se dejó
lista y no se toca por este cambio de plan — ver `google-play-checklist.md`
para el checklist completo, incluido el requisito de testing cerrado
(mínimo 12 testers, 14 días) que aplica a cuentas de desarrollador nuevas.

## 8. Resumen de comandos usados (para copiar y pegar)

Todos se corren desde `apps/mobile/`. Este es el orden real en que se
usaron para generar el primer APK, incluyendo los pasos de diagnóstico
del error de npm (sección 4):

1. `npx eas-cli login` — login con la cuenta de Expo (una sola vez).
2. `npx eas-cli init` — vincula el proyecto con EAS (una sola vez).
3. `npx eas-cli build --platform android --profile standalone` — lanza el
   build que genera el `.apk`.
4. `npx eas-cli build:view <id>` — consulta el estado/logs de un build ya
   lanzado sin tener que relanzarlo (`<id>` es el que aparece en la URL
   que da el comando anterior).
5. `npx expo install --fix` — alinea las dependencias del ecosistema Expo
   a las versiones que espera el SDK instalado (no toca paquetes fuera de
   ese ecosistema, como `react-dom`, así que no alcanza para resolver un
   conflicto de peer dependencies por sí solo).
6. `npm ci --include=dev` — instalación limpia y estricta; sirve para
   reproducir en la máquina local el mismo chequeo que corre EAS en la
   nube, antes de gastar tiempo lanzando un build.
7. Borrar `node_modules` y `package-lock.json` (a mano, desde el
   Explorador de Windows o con `rm -rf node_modules package-lock.json`).
8. `npm install` — reinstala todo de cero y regenera `package-lock.json`
   (correr después del paso 7).
9. Crear `apps/mobile/.npmrc` con `legacy-peer-deps=true` (el fix del
   conflicto de `react-dom`, ver sección 4) y repetir los pasos 7 y 8 para
   confirmar que el proyecto instala limpio.
10. `npx eas-cli build --platform android --profile standalone` — se
    repite una vez resuelto el error, hasta que el build termina bien.
