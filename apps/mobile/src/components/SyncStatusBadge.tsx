// Indicador de estado de sincronización — visible en Home e Historial, per
// la pantalla "Estado de sincronización" de los wireframes de Etapa 1.
// Muestra: sin conexión / sincronizando / N pendientes / todo sincronizado.

import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SyncState } from "@/lib/sync/useSync";
import { colors, fonts, radii, shadow, spacing } from "@/lib/theme";

export function SyncStatusBadge({ sync }: { sync: SyncState }) {
  const { isOnline, isSyncing, pendingCount, lastError, syncNow } = sync;

  let label: string;
  let color: string;

  if (!isOnline) {
    label = pendingCount > 0 ? `Sin conexión · ${pendingCount} pendiente(s)` : "Sin conexión";
    color = colors.inkFaint;
  } else if (isSyncing) {
    label = "Sincronizando…";
    color = colors.brand500;
  } else if (lastError) {
    label = lastError;
    color = colors.danger;
  } else if (pendingCount > 0) {
    label = `${pendingCount} pendiente(s) de sincronizar`;
    color = colors.warning;
  } else {
    label = "Todo sincronizado";
    color = colors.success;
  }

  return (
    <Pressable
      onPress={() => syncNow()}
      accessibilityRole="button"
      accessibilityLabel={`Estado de sincronización: ${label}. Tocar para sincronizar ahora.`}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    ...shadow,
  },
  pressed: { opacity: 0.7 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
});
