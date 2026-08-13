import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { getTaskTypes } from "@/lib/db/catalog";
import { useNewTaskWizard } from "@/lib/wizard/NewTaskWizardContext";
import { StepDots } from "@/components/StepDots";
import { colors, fonts, radii, shadow, spacing } from "@/lib/theme";
import type { TaskType } from "@/lib/types";

export default function ElegirTipoScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { plotId, setTaskType } = useNewTaskWizard();
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);

  useEffect(() => {
    (async () => setTaskTypes(await getTaskTypes(db)))();
  }, [db]);

  // Si se entra directo a este paso (deep link, back raro) sin haber
  // elegido lote todavía, se manda de vuelta al paso 1.
  if (!plotId) {
    return <Redirect href="/nueva-tarea" />;
  }

  function selectTaskType(taskType: TaskType) {
    setTaskType(taskType.id, taskType.default_unit);
    router.push("/nueva-tarea/detalle");
  }

  return (
    <View style={styles.wrapper}>
      <StepDots step={2} />
      <FlatList
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.lg }]}
        data={taskTypes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => selectTaskType(item)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.icon}>
              <Text style={styles.iconText}>🌱</Text>
            </View>
            <Text style={styles.name}>{item.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.cream },
  list: { padding: spacing.lg },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow,
  },
  cardPressed: { backgroundColor: colors.brand50 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 18 },
  name: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.ink },
});
