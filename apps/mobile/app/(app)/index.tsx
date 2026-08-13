import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { getTasksForToday } from "@/lib/db/tasks";
import { getPlots, getTaskTypes } from "@/lib/db/catalog";
import { useSync } from "@/lib/sync/useSync";
import { useAuth } from "@/lib/auth/AuthContext";
import { SyncStatusBadge } from "@/components/SyncStatusBadge";
import type { LocalTask, Plot, TaskType } from "@/lib/types";

export default function HomeScreen() {
  const db = useSQLiteContext();
  const sync = useSync();
  const { signOut } = useAuth();
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [plots, setPlots] = useState<Record<string, Plot>>({});
  const [taskTypes, setTaskTypes] = useState<Record<string, TaskType>>({});

  const load = useCallback(async () => {
    const [todayTasks, plotRows, taskTypeRows] = await Promise.all([
      getTasksForToday(db),
      getPlots(db),
      getTaskTypes(db),
    ]);
    setTasks(todayTasks);
    setPlots(Object.fromEntries(plotRows.map((p) => [p.id, p])));
    setTaskTypes(Object.fromEntries(taskTypeRows.map((t) => [t.id, t])));
  }, [db]);

  // Recarga cada vez que la pantalla vuelve a tener foco — cubre el caso de
  // volver de "Nueva tarea" recién guardada, y de que la sync haya corrido
  // en segundo plano.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={styles.container}>
      <SyncStatusBadge sync={sync} />

      <Link href="/nueva-tarea" asChild>
        <Pressable style={styles.primaryButton} accessibilityRole="button">
          <Text style={styles.primaryButtonText}>+ Nueva tarea</Text>
        </Pressable>
      </Link>

      <Text style={styles.sectionTitle}>Hoy</Text>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>Todavía no registraste ninguna tarea hoy.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.taskRow}>
            <Text style={styles.taskType}>
              {taskTypes[item.task_type_id]?.name ?? "Tarea"}
            </Text>
            <Text style={styles.taskDetail}>
              {plots[item.plot_id]?.name ?? "—"} · {item.quantity} {item.unit}
            </Text>
            {item.sync_status === "pending" && (
              <Text style={styles.pendingTag}>Pendiente de sincronizar</Text>
            )}
            {item.sync_status === "error" && (
              <Text style={styles.errorTag}>Error al sincronizar</Text>
            )}
          </View>
        )}
      />

      <View style={styles.footer}>
        <Link href="/historial" asChild>
          <Pressable accessibilityRole="button">
            <Text style={styles.link}>Ver historial completo</Text>
          </Pressable>
        </Link>
        <Pressable onPress={() => signOut()} accessibilityRole="button">
          <Text style={styles.link}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  primaryButton: {
    backgroundColor: "#1c1917",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginVertical: 12,
  },
  primaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "600", marginBottom: 8, color: "#44403c" },
  empty: { color: "#78716c", fontSize: 14, paddingVertical: 16 },
  taskRow: {
    borderWidth: 1,
    borderColor: "#e7e5e4",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  taskType: { fontWeight: "600", fontSize: 15 },
  taskDetail: { color: "#57534e", fontSize: 13, marginTop: 2 },
  pendingTag: { color: "#d97706", fontSize: 12, marginTop: 4 },
  errorTag: { color: "#dc2626", fontSize: 12, marginTop: 4 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e7e5e4",
  },
  link: { color: "#2563eb", fontSize: 14, fontWeight: "500" },
});
