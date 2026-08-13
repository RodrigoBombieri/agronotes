import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { getTaskTypes } from "@/lib/db/catalog";
import { useNewTaskWizard } from "@/lib/wizard/NewTaskWizardContext";
import type { TaskType } from "@/lib/types";

export default function ElegirTipoScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
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
    <FlatList
      contentContainerStyle={styles.list}
      data={taskTypes}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => selectTaskType(item)}
          accessibilityRole="button"
          style={styles.row}
        >
          <Text style={styles.name}>{item.name}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  row: {
    borderWidth: 1,
    borderColor: "#e7e5e4",
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  name: { fontSize: 16, fontWeight: "600" },
});
