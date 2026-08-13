import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { getFields, getPlots } from "@/lib/db/catalog";
import { useNewTaskWizard } from "@/lib/wizard/NewTaskWizardContext";
import { StepDots } from "@/components/StepDots";
import { colors, fonts, radii, shadow, spacing } from "@/lib/theme";
import type { Field, Plot } from "@/lib/types";

export default function ElegirLoteScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
      <View style={styles.wrapper}>
        <StepDots step={1} />
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Todavía no hay lotes descargados</Text>
          <Text style={styles.emptyText}>
            Conectate a internet una vez para que la app baje el catálogo de campos y lotes.
            Después funciona sin conexión.
          </Text>
        </View>
      </View>
    );
  }

  const fieldName = (fieldId: string) => fields.find((f) => f.id === fieldId)?.name ?? "—";

  return (
    <View style={styles.wrapper}>
      <StepDots step={1} />
      <FlatList
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.lg }]}
        data={plots}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => selectPlot(item.id)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.icon}>
              <Text style={styles.iconText}>🌾</Text>
            </View>
            <View>
              <Text style={styles.plotName}>{item.name}</Text>
              <Text style={styles.fieldName}>{fieldName(item.field_id)}</Text>
            </View>
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
  plotName: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.ink },
  fieldName: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginTop: 2 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl },
  emptyTitle: { fontFamily: fonts.extraBold, fontSize: 16, textAlign: "center", marginBottom: spacing.sm, color: colors.ink },
  emptyText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.inkMuted, textAlign: "center" },
});
