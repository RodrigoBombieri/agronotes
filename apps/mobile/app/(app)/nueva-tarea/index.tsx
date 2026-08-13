import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { getFields, getPlots } from "@/lib/db/catalog";
import { useNewTaskWizard } from "@/lib/wizard/NewTaskWizardContext";
import type { Field, Plot } from "@/lib/types";

export default function ElegirLoteScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { setPlot } = useNewTaskWizard();
  const [fields, setFields] = useState<Field[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);

  useEffect(() => {
    (async () => {
      setFields(await getFields(db));
      setPlots(await getPlots(db));
    })();
  }, [db]);

  function selectPlot(plotId: string) {
    setPlot(plotId);
    router.push("/nueva-tarea/tipo");
  }

  if (plots.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Todavía no hay lotes descargados</Text>
        <Text style={styles.emptyText}>
          Conectate a internet una vez para que la app baje el catálogo de campos y lotes.
          Después funciona sin conexión.
        </Text>
      </View>
    );
  }

  const fieldName = (fieldId: string) => fields.find((f) => f.id === fieldId)?.name ?? "—";

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={plots}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => selectPlot(item.id)}
          accessibilityRole="button"
          style={styles.row}
        >
          <Text style={styles.plotName}>{item.name}</Text>
          <Text style={styles.fieldName}>{fieldName(item.field_id)}</Text>
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
  plotName: { fontSize: 16, fontWeight: "600" },
  fieldName: { fontSize: 13, color: "#78716c", marginTop: 2 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "600", textAlign: "center", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#57534e", textAlign: "center" },
});
