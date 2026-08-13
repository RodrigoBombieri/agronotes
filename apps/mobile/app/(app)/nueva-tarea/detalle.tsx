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
import { Redirect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { insertLocalTask } from "@/lib/db/tasks";
import { useNewTaskWizard } from "@/lib/wizard/NewTaskWizardContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { useSync } from "@/lib/sync/useSync";

export default function DetalleScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
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
      <ScrollView contentContainerStyle={styles.container}>
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
          style={[styles.button, saving && styles.buttonDisabled]}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>{saving ? "Guardando…" : "Guardar tarea"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 16 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, color: "#44403c" },
  input: {
    borderWidth: 1,
    borderColor: "#d6d3d1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textarea: { minHeight: 90, textAlignVertical: "top" },
  error: { color: "#dc2626", marginBottom: 12, fontSize: 13 },
  button: {
    backgroundColor: "#1c1917",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
