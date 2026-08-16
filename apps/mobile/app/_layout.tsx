// Layout raíz. Monta, en este orden, los dos providers que necesita toda
// la app: SQLite (base local) y Auth (sesión de Supabase). La protección de
// rutas vive un nivel más abajo, en app/(app)/_layout.tsx — acá solo se
// arma el árbol de providers y el Stack de navegación de nivel superior.

import { useEffect } from "react";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import * as Sentry from "@sentry/react-native";
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";
import { DB_NAME, migrateDbIfNeeded } from "@/lib/db/schema";
import { AuthProvider } from "@/lib/auth/AuthContext";

// Mantiene visible el splash nativo (logo de Agronotes, ver app.json) hasta
// que Nunito termine de cargar — así se evita el "flash" de la fuente del
// sistema por medio segundo al abrir la app.
SplashScreen.preventAutoHideAsync();

// Observabilidad (Etapa 6) — captura crashes y errores no manejados en el
// dispositivo. Solo necesita el DSN para funcionar (ver apps/mobile/.env);
// la subida de source maps para EAS Build queda pendiente aparte (necesita
// el plugin de Expo + metro.config.js + org/project de Sentry, todavía no
// configurados — sin eso los stack traces en producción llegan sin
// símbolos, pero los eventos de error/crash ya se reciben igual).
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  enabled: !__DEV__ || Boolean(process.env.EXPO_PUBLIC_SENTRY_DSN),
});

function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName={DB_NAME} onInit={migrateDbIfNeeded}>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="(app)" />
          </Stack>
        </AuthProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);
