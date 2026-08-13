import { Stack } from "expo-router";
import { NewTaskWizardProvider } from "@/lib/wizard/NewTaskWizardContext";
import { colors, fonts } from "@/lib/theme";

export default function NuevaTareaLayout() {
  return (
    <NewTaskWizardProvider>
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.brand900 },
          headerTintColor: colors.white,
          headerTitleStyle: { fontFamily: fonts.extraBold, fontSize: 16 },
          contentStyle: { backgroundColor: colors.cream },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Paso 1 de 3 · Lote" }} />
        <Stack.Screen name="tipo" options={{ title: "Paso 2 de 3 · Tipo de tarea" }} />
        <Stack.Screen name="detalle" options={{ title: "Paso 3 de 3 · Detalle" }} />
      </Stack>
    </NewTaskWizardProvider>
  );
}
