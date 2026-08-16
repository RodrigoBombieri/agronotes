import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { getTasksForToday } from "@/lib/db/tasks";
import { getPlots, getTaskTypes } from "@/lib/db/catalog";
import { useSync } from "@/lib/sync/useSync";
import { useAuth } from "@/lib/auth/AuthContext";
import { SyncStatusBadge } from "@/components/SyncStatusBadge";
import { colors, fonts, radii, shadow, spacing } from "@/lib/theme";
import type { LocalTask, Plot, TaskType } from "@/lib/types";

export default function HomeScreen() {
  const db = useSQLiteContext();
  const sync = useSync();
  const router = useRouter();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const { guardada } = useLocalSearchParams<{ guardada?: string }>();
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [plots, setPlots] = useState<Record<string, Plot>>({});
  const [taskTypes, setTaskTypes] = useState<Record<string, TaskType>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [avisoOculto, setAvisoOculto] = useState(false);

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

  // Pull-to-refresh: fuerza un ciclo de sync y vuelve a leer la base local.
  // Hasta ahora la sync solo se disparaba sola (al arrancar o al recuperar
  // conexión) y no había forma manual de reintentar desde la UI, que es
  // justo lo que uno hace cuando ve el indicador en amarillo.
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await sync.syncNow();
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [sync, load]);

  const mostrarAviso = guardada === "otra-fecha" && !avisoOculto;

  return (
    <View style={styles.container}>
      <SyncStatusBadge sync={sync} />

      {mostrarAviso && (
        <Pressable
          onPress={() => setAvisoOculto(true)}
          accessibilityRole="button"
          accessibilityLabel="Ocultar aviso"
          style={styles.notice}
        >
          <Text style={styles.noticeText}>
            Guardaste una tarea con fecha anterior a hoy. La vas a encontrar en el historial, no en
            esta lista.
          </Text>
        </Pressable>
      )}

      <Link href="/nueva-tarea" asChild>
        <Pressable
          style={styles.primaryButton}
          android_ripple={{ color: colors.brand700 }}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>+ Nueva tarea</Text>
        </Pressable>
      </Link>

      <Text style={styles.sectionTitle}>Hoy</Text>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.brand700]}
            tintColor={colors.brand700}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Todavía no registraste ninguna tarea hoy.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: "/tarea/[id]", params: { id: item.id } })}
            accessibilityRole="button"
            accessibilityLabel={`Editar tarea ${taskTypes[item.task_type_id]?.name ?? ""}`}
            style={({ pressed }) => [styles.taskRow, pressed && styles.taskRowPressed]}
          >
            <Text style={styles.taskType}>
              {taskTypes[item.task_type_id]?.name ?? "Tarea"}
            </Text>
            <Text style={styles.taskDetail}>
              {plots[item.plot_id]?.name ?? "—"} · {item.quantity} {item.unit}
            </Text>
            {item.sync_status === "pending" && (
              <Text style={[styles.tag, styles.tagPending]}>Pendiente de sincronizar</Text>
            )}
            {item.sync_status === "error" && (
              <Text style={[styles.tag, styles.tagError]}>Error al sincronizar</Text>
            )}
          </Pressable>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
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
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.cream },
  notice: {
    backgroundColor: colors.brand50,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.brand200,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  noticeText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.brand800, lineHeight: 19 },
  primaryButton: {
    backgroundColor: colors.brand900,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: "center",
    marginVertical: spacing.md,
    ...shadow,
  },
  primaryButtonText: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 16 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: fonts.extraBold,
    marginBottom: spacing.sm,
    color: colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  empty: { color: colors.inkMuted, fontFamily: fonts.semiBold, fontSize: 14, paddingVertical: spacing.lg },
  taskRow: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow,
  },
  taskRowPressed: { backgroundColor: colors.brand50 },
  taskType: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.brand900 },
  taskDetail: { fontFamily: fonts.semiBold, color: colors.inkMuted, fontSize: 13, marginTop: 2 },
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
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  link: { color: colors.brand700, fontSize: 14, fontFamily: fonts.extraBold },
});
