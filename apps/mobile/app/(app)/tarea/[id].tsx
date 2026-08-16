// Edición y anulación de una tarea ya registrada (Etapa 6, 2026-08-16).
// Hasta ahora esto solo existía en el panel web y era uno de los huecos de
// UX del mobile: el encargado que se equivocaba de lote o de cantidad tenía
// que pedirle al admin que lo corrigiera desde la computadora.
//
// Igual que el alta, todo es offline-first: se escribe en la SQLite local al
// instante y la fila queda 'pending' para que el motor de sync la reenvíe.
// Como el `id` no cambia, en el servidor es un upsert sobre la misma fila
// (last-write-wins), nunca un duplicado.
//
// Alcance a propósito: solo se pueden editar las tareas propias. Un admin
// que necesite corregir la tarea de otro lo hace desde el panel web, que es
// donde ve las tareas de toda la organización — el celular solo tiene en su
// base local las que se cargaron en ese mismo dispositivo.

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { getTaskById, softDeleteLocalTask, updateLocalTask } from "@/lib/db/tasks";
import { getPlots, getTaskTypes } from "@/lib/db/catalog";
import { useAuth } from "@/lib/auth/AuthContext";
import { useSync } from "@/lib/sync/useSync";
import { DateTimeField } from "@/components/DateTimeField";
import { colors, fonts, radii, shadow, spacing } from "@/lib/theme";
import type { LocalTask, Plot, TaskType } from "@/lib/types";

export default function EditarTareaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const sync = useSync();

  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<LocalTask | null>(null);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);

  const [plotId, setPlotId] = useState<string | null>(null);
  const [taskTypeId, setTaskTypeId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [note, setNote] = useState("");
  const [occurredAt, setOccurredAt] = useState<Date>(new Date());

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [row, plotRows, taskTypeRows] = await Promise.all([
        getTaskById(db, id),
        getPlots(db),
        getTaskTypes(db),
      ]);
      if (cancelled) return;

      setPlots(plotRows);
      setTaskTypes(taskTypeRows);
      setTask(row);

      if (row) {
        setPlotId(row.plot_id);
        setTaskTypeId(row.task_type_id);
        setQuantity(String(row.quantity));
        setUnit(row.unit);
        setNote(row.note ?? "");
        setOccurredAt(new Date(row.occurred_at));
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [db, id]);

  const handleGuardar = useCallback(async () => {
    setError(null);

    const quantityNumber = Number(quantity.replace(",", "."));
    if (!quantity || Number.isNaN(quantityNumber) || quantityNumber <= 0) {
      setError("Ingresá una cantidad válida, mayor a 0.");
      return;
    }
    if (!unit.trim()) {
      setError("Ingresá una unidad (ej: litros, kg, hectáreas).");
      return;
    }
    if (!plotId || !taskTypeId) {
      setError("Elegí un lote y un tipo de tarea.");
      return;
    }

    setSaving(true);
    try {
      await updateLocalTask(db, id, {
        plot_id: plotId,
        task_type_id: taskTypeId,
        quantity: quantityNumber,
        unit: unit.trim(),
        note: note.trim() || null,
        occurred_at: occurredAt.toISOString(),
      });
      sync.syncNow();
      router.back();
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : "No se pudieron guardar los cambios.");
    }
  }, [db, id, plotId, taskTypeId, quantity, unit, note, occurredAt, router, sync]);

  const handleAnular = useCallback(() => {
    Alert.alert(
      "Anular tarea",
      "La tarea deja de aparecer en la app y en el panel web. No se borra: queda registrada como anulada.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Anular",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              await softDeleteLocalTask(db, id);
              sync.syncNow();
              router.replace({ pathname: "/" });
            } catch (err) {
              setSaving(false);
              setError(err instanceof Error ? err.message : "No se pudo anular la tarea.");
            }
          },
        },
      ],
    );
  }, [db, id, router, sync]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Cargando…</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>
          No se encontró esta tarea en el dispositivo. Puede haberse cargado desde otro celular —
          en ese caso se edita desde el panel web.
        </Text>
      </View>
    );
  }

  if (task.deleted_at) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Esta tarea está anulada.</Text>
      </View>
    );
  }

  if (session && task.user_id !== session.user.id) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>
          Esta tarea la cargó otro usuario. Cada uno edita las propias; si hace falta corregirla,
          pedíselo a un admin desde el panel web.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        {task.sync_status === "error" && task.sync_error && (
          <Text style={styles.syncError} accessibilityRole="alert">
            Última sincronización fallida: {task.sync_error}
          </Text>
        )}

        <Text style={styles.label}>Lote</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsRow}
          contentContainerStyle={styles.chipsRowContent}
        >
          {plots.map((plot) => (
            <Chip
              key={plot.id}
              label={plot.name}
              active={plotId === plot.id}
              onPress={() => setPlotId(plot.id)}
            />
          ))}
        </ScrollView>

        <Text style={styles.label}>Tipo de tarea</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsRow}
          contentContainerStyle={styles.chipsRowContent}
        >
          {taskTypes.map((type) => (
            <Chip
              key={type.id}
              label={type.name}
              active={taskTypeId === type.id}
              onPress={() => setTaskTypeId(type.id)}
            />
          ))}
        </ScrollView>

        <View style={styles.field}>
          <Text style={styles.label}>Cantidad</Text>
          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
            style={styles.input}
            accessibilityLabel="Cantidad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Unidad</Text>
          <TextInput
            value={unit}
            onChangeText={setUnit}
            style={styles.input}
            placeholder="litros, kg, hectáreas…"
            placeholderTextColor={colors.inkFaint}
            accessibilityLabel="Unidad"
          />
        </View>

        <DateTimeField value={occurredAt} onChange={setOccurredAt} />

        <View style={styles.field}>
          <Text style={styles.label}>Observación (opcional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
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
          <Text style={styles.buttonText}>{saving ? "Guardando…" : "Guardar cambios"}</Text>
        </Pressable>

        <Pressable
          onPress={handleAnular}
          disabled={saving}
          style={({ pressed }) => [
            styles.dangerButton,
            saving && styles.buttonDisabled,
            pressed && styles.dangerButtonPressed,
          ]}
          accessibilityRole="button"
        >
          <Text style={styles.dangerButtonText}>Anular tarea</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.cream },
  container: { padding: spacing.lg },
  centered: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  message: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.inkMuted,
    textAlign: "center",
    lineHeight: 22,
  },
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
  chipsRow: { flexGrow: 0, marginBottom: spacing.md },
  chipsRowContent: { flexDirection: "row", alignItems: "flex-start" },
  chip: {
    backgroundColor: colors.brand50,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.brand900 },
  chipText: { fontSize: 13, fontFamily: fonts.bold, color: colors.brand800 },
  chipTextActive: { color: colors.white },
  error: { fontFamily: fonts.bold, color: colors.danger, marginBottom: spacing.sm, fontSize: 13 },
  syncError: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
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
  dangerButton: {
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.danger,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: spacing.md,
  },
  dangerButtonPressed: { backgroundColor: colors.dangerBg },
  dangerButtonText: { fontFamily: fonts.extraBold, color: colors.danger, fontSize: 15 },
});
