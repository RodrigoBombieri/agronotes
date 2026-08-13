// Layout del área protegida. Si no hay sesión, redirige a /login — este es
// el único lugar donde vive esa lógica, todo lo que cuelga de acá (Home,
// Historial, Nueva tarea) puede asumir que `session` existe.

import { ActivityIndicator, View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/lib/auth/AuthContext";

export default function AppLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Agronotes" }} />
      <Stack.Screen name="historial" options={{ title: "Historial" }} />
      <Stack.Screen name="nueva-tarea" options={{ headerShown: false }} />
    </Stack>
  );
}
