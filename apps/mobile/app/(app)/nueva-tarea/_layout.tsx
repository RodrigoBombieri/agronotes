import { Stack } from "expo-router";
import { NewTaskWizardProvider } from "@/lib/wizard/NewTaskWizardContext";

export default function NuevaTareaLayout() {
  return (
    <NewTaskWizardProvider>
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="index" options={{ title: "1/3 · Lote" }} />
        <Stack.Screen name="tipo" options={{ title: "2/3 · Tipo de tarea" }} />
        <Stack.Screen name="detalle" options={{ title: "3/3 · Detalle" }} />
      </Stack>
    </NewTaskWizardProvider>
  );
}
