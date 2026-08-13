// Layout raíz. Monta, en este orden, los dos providers que necesita toda
// la app: SQLite (base local) y Auth (sesión de Supabase). La protección de
// rutas vive un nivel más abajo, en app/(app)/_layout.tsx — acá solo se
// arma el árbol de providers y el Stack de navegación de nivel superior.

import { useEffect } from "react";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
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

export default function RootLayout() {
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
