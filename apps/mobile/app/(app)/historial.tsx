// Historial filtrable por lote, tipo de tarea y rango de fecha rápido.
// Trabaja 100% contra la SQLite local (no pega a Supabase) — por eso
// también funciona sin conexión, incluye tareas 'pending' todavía no
// sincronizadas y muestra su estado.

import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { getTaskHistory, type TaskHistoryFilters } from "@/lib/db/tasks";
import { getPlots, getTaskTypes } from "@/lib/db/catalog";
import { useSync } from "@/lib/sync/useSync";
import { SyncStatusBadge } from "@/components/SyncStatusBadge";
import { colors, fonts, radii, shadow, spacing } from "@/lib/theme";
import type { LocalTask, Plot, TaskType } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const RANGE_OPTIONS = [
  { label: "7 días", days: 7 },
  { label: "30 días", days: 30 },
  { label: "Todo", days: null as number | null },
];

export default function HistorialScreen() {
  const db = useSQLiteContext();
  const sync = useSync();
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [plotFilter, setPlotFilter] = useState<string | null>(null);
  const [taskTypeFilter, setTaskTypeFilter] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState<number | null>(30);

  const load = useCallback(async () => {
    const filters: TaskHistoryFilters = {};
    if (plotFilter) filters.plotId = plotFilter;
    if (taskTypeFilter) filters.taskTypeId = taskTypeFilter;
    if (rangeDays) {
      const from = new Date();
      from.setDate(from.getDate() - rangeDays);
      filters.from = from.toISOString();
    }

    const [rows, plotRows, taskTypeRows] = await Promise.all([
      getTaskHistory(db, filters),
      getPlots(db),
      getTaskTypes(db),
    ]);
    setTasks(rows);
    setPlots(plotRows);
    setTaskTypes(taskTypeRows);
  }, [db, plotFilter, taskTypeFilter, rangeDays]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const plotName = (id: string) => plots.find((p) => p.id === id)?.name ?? "—";
  const taskTypeName = (id: string) => taskTypes.find((t) => t.id === id)?.name ?? "Tarea";

  return (
    <View style={styles.container}>
      <SyncStatusBadge sync={sync} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsRow}
        contentContainerStyle={styles.chipsRowContent}
      >
        {RANGE_OPTIONS.map((opt) => (
          <Chip
            key={opt.label}
            label={opt.label}
            active={rangeDays === opt.days}
            onPress={() => setRangeDays(opt.days)}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsRow}
        contentContainerStyle={styles.chipsRowContent}
      >
        <Chip label="Todos los lotes" active={!plotFilter} onPress={() => setPlotFilter(null)} />
        {plots.map((p) => (
          <Chip
            key={p.id}
            label={p.name}
            active={plotFilter === p.id}
            onPress={() => setPlotFilter(p.id)}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsRow}
        contentContainerStyle={styles.chipsRowContent}
      >
        <Chip
          label="Todos los tipos"
          active={!taskTypeFilter}
          onPress={() => setTaskTypeFilter(null)}
        />
        {taskTypes.map((t) => (
          <Chip
            key={t.id}
            label={t.name}
            active={taskTypeFilter === t.id}
            onPress={() => setTaskTypeFilter(t.id)}
          />
        ))}
      </ScrollView>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.xl }]}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay tareas que coincidan con estos filtros.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.taskType}>{taskTypeName(item.task_type_id)}</Text>
              <Text style={styles.date}>{dateFormatter.format(new Date(item.occurred_at))}</Text>
            </View>
            <Text style={styles.detail}>
              {plotName(item.plot_id)} · {item.quantity} {item.unit}
            </Text>
            {item.note && <Text style={styles.note}>{item.note}</Text>}
            {item.sync_status !== "synced" && (
              <Text
                style={[
                  styles.tag,
                  item.sync_status === "error" ? styles.tagError : styles.tagPending,
                ]}
              >
                {item.sync_status === "error" ? "Error al sincronizar" : "Pendiente de sincronizar"}
              </Text>
            )}
          </View>
        )}
      />
    </View>
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
  container: { flex: 1, paddingHorizontal: spacing.lg, backgroundColor: colors.cream },
  chipsRow: { flexGrow: 0, marginBottom: spacing.sm },
  chipsRowContent: { flexDirection: "row", alignItems: "flex-start" },
  chip: {
    backgroundColor: colors.brand50,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.brand900 },
  chipText: { fontSize: 13, fontFamily: fonts.bold, color: colors.brand800 },
  chipTextActive: { color: colors.white },
  list: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
  empty: { color: colors.inkMuted, fontFamily: fonts.semiBold, fontSize: 14, paddingVertical: spacing.xl, textAlign: "center" },
  row: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow,
  },
  rowHeader: { flexDirection: "row", justifyContent: "space-between" },
  taskType: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.brand900 },
  date: { color: colors.inkFaint, fontFamily: fonts.semiBold, fontSize: 12 },
  detail: { color: colors.inkMuted, fontFamily: fonts.semiBold, fontSize: 13, marginTop: 2 },
  note: { color: colors.inkFaint, fontFamily: fonts.semiBold, fontSize: 13, marginTop: spacing.xs, fontStyle: "italic" },
  tag: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    fontFamily: fonts.extraBold,
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  tagPending: { color: colors.warning, backgroundColor: colors.warningBg },
  tagError: { color: colors.danger, backgroundColor: colors.dangerBg },
});
