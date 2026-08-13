// Indicador de estado de sincronización — visible en Home e Historial, per
// la pantalla "Estado de sincronización" de los wireframes de Etapa 1.
// Muestra: sin conexión / sincronizando / N pendientes / todo sincronizado.

import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SyncState } from "@/lib/sync/useSync";

export function SyncStatusBadge({ sync }: { sync: SyncState }) {
  const { isOnline, isSyncing, pendingCount, lastError, syncNow } = sync;

  let label: string;
  let color: string;

  if (!isOnline) {
    label = pendingCount > 0 ? `Sin conexión · ${pendingCount} pendiente(s)` : "Sin conexión";
    color = "#78716c";
  } else if (isSyncing) {
    label = "Sincronizando…";
    color = "#2563eb";
  } else if (lastError) {
    label = lastError;
    color = "#dc2626";
  } else if (pendingCount > 0) {
    label = `${pendingCount} pendiente(s) de sincronizar`;
    color = "#d97706";
  } else {
    label = "Todo sincronizado";
    color = "#16a34a";
  }

  return (
    <Pressable
      onPress={() => syncNow()}
      accessibilityRole="button"
      accessibilityLabel={`Estado de sincronización: ${label}. Tocar para sincronizar ahora.`}
      style={styles.container}
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
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    color: "#44403c",
  },
});
