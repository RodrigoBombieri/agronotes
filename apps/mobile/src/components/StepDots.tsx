// Barra de progreso de 3 puntos para el wizard de Nueva tarea — refuerza
// visualmente "en qué paso estoy" además del título del header.

import { StyleSheet, View } from "react-native";
import { colors, spacing } from "@/lib/theme";

export function StepDots({ step }: { step: 1 | 2 | 3 }) {
  return (
    <View style={styles.row}>
      {[1, 2, 3].map((n) => (
        <View key={n} style={[styles.dot, n <= step && styles.dotActive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  dot: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.brand100 },
  dotActive: { backgroundColor: colors.brand500 },
});
