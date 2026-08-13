// Historial filtrable por lote, tipo de tarea y rango de fecha rápido.
// Trabaja 100% contra la SQLite local (no pega a Supabase) — por eso
// también funciona sin conexión, incluye tareas 'pending' todavía no
// sincronizadas y muestra su estado.

import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { getTaskHistory, type TaskHistoryFilters } from "@/lib/db/tasks";
import { getPlots, getTaskTypes } from "@/lib/db/catalog";
import { useSync } from "@/lib/sync/useSync";
import { SyncStatusBadge } from "@/components/SyncStatusBadge";
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {RANGE_OPTIONS.map((opt) => (
          <Chip
            key={opt.label}
            label={opt.label}
            active={rangeDays === opt.days}
            onPress={() => setRangeDays(opt.days)}
          />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
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
        contentContainerStyle={styles.list}
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
              <Text style={item.sync_status === "error" ? styles.errorTag : styles.pendingTag}>
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
  container: { flex: 1, paddingHorizontal: 16 },
  chipsRow: { flexDirection: "row", marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#d6d3d1",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#1c1917", borderColor: "#1c1917" },
  chipText: { fontSize: 13, color: "#44403c" },
  chipTextActive: { color: "#fff" },
  list: { paddingTop: 8, paddingBottom: 24 },
  empty: { color: "#78716c", fontSize: 14, paddingVertical: 24, textAlign: "center" },
  row: {
    borderWidth: 1,
    borderColor: "#e7e5e4",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  rowHeader: { flexDirection: "row", justifyContent: "space-between" },
  taskType: { fontWeight: "600", fontSize: 15 },
  date: { color: "#78716c", fontSize: 12 },
  detail: { color: "#57534e", fontSize: 13, marginTop: 2 },
  note: { color: "#78716c", fontSize: 13, marginTop: 4, fontStyle: "italic" },
  pendingTag: { color: "#d97706", fontSize: 12, marginTop: 4 },
  errorTag: { color: "#dc2626", fontSize: 12, marginTop: 4 },
});
