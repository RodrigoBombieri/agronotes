// Layout del área protegida. Si no hay sesión, redirige a /login — este es
// el único lugar donde vive esa lógica, todo lo que cuelga de acá (Home,
// Historial, Nueva tarea) puede asumir que `session` existe.

import { ActivityIndicator, View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/lib/auth/AuthContext";
import { colors, fonts } from "@/lib/theme";

export default function AppLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.cream }}>
        <ActivityIndicator color={colors.brand700} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.brand900 },
          headerTintColor: colors.white,
          headerTitleStyle: { fontFamily: fonts.extraBold, fontSize: 17 },
          contentStyle: { backgroundColor: colors.cream },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Agronotes" }} />
        <Stack.Screen name="historial" options={{ title: "Historial" }} />
        <Stack.Screen name="nueva-tarea" options={{ headerShown: false }} />
        <Stack.Screen name="tarea/[id]" options={{ title: "Editar tarea" }} />
      </Stack>
    </>
  );
}
