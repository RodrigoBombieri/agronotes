import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { insertLocalTask } from "@/lib/db/tasks";
import { useNewTaskWizard } from "@/lib/wizard/NewTaskWizardContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { useSync } from "@/lib/sync/useSync";
import { StepDots } from "@/components/StepDots";
import { colors, fonts, radii, shadow, spacing } from "@/lib/theme";

export default function DetalleScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const sync = useSync();
  const wizard = useNewTaskWizard();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Guarda de flujo: si falta un paso anterior, de vuelta al principio.
  if (!wizard.plotId || !wizard.taskTypeId) {
    return <Redirect href="/nueva-tarea" />;
  }

  async function handleGuardar() {
    setError(null);

    const quantityNumber = Number(wizard.quantity.replace(",", "."));
    if (!wizard.quantity || Number.isNaN(quantityNumber) || quantityNumber <= 0) {
      setError("Ingresá una cantidad válida, mayor a 0.");
      return;
    }
    if (!wizard.unit.trim()) {
      setError("Ingresá una unidad (ej: litros, kg, hectáreas).");
      return;
    }
    if (!session) {
      setError("Sesión inválida, volvé a iniciar sesión.");
      return;
    }

    setSaving(true);
    try {
      // Guarda local primero, siempre — nunca se espera la red acá. La app
      // nunca bloquea el registro de una tarea por falta de conexión.
      await insertLocalTask(db, session.user.id, {
        plot_id: wizard.plotId!,
        task_type_id: wizard.taskTypeId!,
        quantity: quantityNumber,
        unit: wizard.unit.trim(),
        note: wizard.note.trim() || null,
        occurred_at: new Date().toISOString(),
      });

      wizard.reset();
      // Dispara un intento de sync en segundo plano (no bloquea la
      // navegación — si no hay señal, la tarea queda 'pending' y listo).
      sync.syncNow();
      router.replace("/");
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : "No se pudo guardar la tarea.");
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StepDots step={3} />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <View style={styles.field}>
          <Text style={styles.label}>Cantidad</Text>
          <TextInput
            value={wizard.quantity}
            onChangeText={wizard.setQuantity}
            keyboardType="decimal-pad"
            style={styles.input}
            accessibilityLabel="Cantidad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Unidad</Text>
          <TextInput
            value={wizard.unit}
            onChangeText={wizard.setUnit}
            style={styles.input}
            placeholder="litros, kg, hectáreas…"
            placeholderTextColor={colors.inkFaint}
            accessibilityLabel="Unidad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Observación (opcional)</Text>
          <TextInput
            value={wizard.note}
            onChangeText={wizard.setNote}
            style={[styles.input, styles.textarea]}
            multiline
            numberOfLines={4}
            accessibilityLabel="Observación"
          />
        </View>

        {error && (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        )}

        <Pressable
          onPress={handleGuardar}
          disabled={saving}
          style={({ pressed }) => [
            styles.button,
            saving && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>{saving ? "Guardando…" : "Guardar tarea"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.cream },
  container: { padding: spacing.lg },
  field: { marginBottom: spacing.md },
  label: { fontFamily: fonts.bold, fontSize: 12, marginBottom: 6, color: colors.ink },
  input: {
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  textarea: { minHeight: 90, textAlignVertical: "top" },
  error: { fontFamily: fonts.bold, color: colors.danger, marginBottom: spacing.sm, fontSize: 13 },
  button: {
    backgroundColor: colors.brand900,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: spacing.xs,
    ...shadow,
  },
  buttonPressed: { backgroundColor: colors.brand700 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontFamily: fonts.extraBold, color: colors.white, fontSize: 16 },
});
