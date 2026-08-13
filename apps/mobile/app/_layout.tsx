// Layout raíz. Monta, en este orden, los dos providers que necesita toda
// la app: SQLite (base local) y Auth (sesión de Supabase). La protección de
// rutas vive un nivel más abajo, en app/(app)/_layout.tsx — acá solo se
// arma el árbol de providers y el Stack de navegación de nivel superior.

import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { DB_NAME, migrateDbIfNeeded } from "@/lib/db/schema";
import { AuthProvider } from "@/lib/auth/AuthContext";

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={DB_NAME} onInit={migrateDbIfNeeded}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="(app)" />
        </Stack>
      </AuthProvider>
    </SQLiteProvider>
  );
}
