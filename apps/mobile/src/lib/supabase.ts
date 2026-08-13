// Cliente de Supabase para el mobile. A diferencia del panel web (que usa
// cookies vía @supabase/ssr), acá la sesión se persiste con AsyncStorage —
// es el patrón estándar de Supabase para React Native/Expo.
//
// Igual que en el panel web: se usa el publishable/anon key, nunca una
// service role key. Toda la data queda filtrada por RLS real en Postgres,
// nunca por lógica del cliente (ver decisiones clave en CLAUDE.md).

import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copiá .env.example a .env y completá los valores.",
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
