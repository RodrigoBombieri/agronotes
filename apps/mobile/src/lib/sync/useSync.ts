// Hook que dispara runSync() automáticamente: al montar, cada vez que
// NetInfo detecta que se recuperó la conexión, y expone una función
// `syncNow` para que la UI pueda forzarlo a mano (botón de refresh).
// También expone `pendingCount` para el indicador de sync de la Etapa 1.

import { useCallback, useEffect, useRef, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useSQLiteContext } from "expo-sqlite";
import { supabase } from "@/lib/supabase";
import { runSync } from "@/lib/sync/engine";
import { countPendingTasks } from "@/lib/db/tasks";

export type SyncState = {
  isSyncing: boolean;
  isOnline: boolean;
  lastSyncAt: Date | null;
  lastError: string | null;
  pendingCount: number;
  syncNow: () => Promise<void>;
};

export function useSync(): SyncState {
  const db = useSQLiteContext();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const syncInFlight = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    const count = await countPendingTasks(db);
    setPendingCount(count);
  }, [db]);

  const syncNow = useCallback(async () => {
    if (syncInFlight.current) return;
    syncInFlight.current = true;
    setIsSyncing(true);
    setLastError(null);

    try {
      const result = await runSync(db, supabase);
      setLastSyncAt(new Date());
      if (result.failed > 0) {
        setLastError(`${result.failed} tarea(s) no se pudieron sincronizar todavía.`);
      }
    } catch (err) {
      setLastError(err instanceof Error ? err.message : "Error de sincronización");
    } finally {
      await refreshPendingCount();
      setIsSyncing(false);
      syncInFlight.current = false;
    }
  }, [db, refreshPendingCount]);

  // Sync al montar la app.
  useEffect(() => {
    refreshPendingCount();
    syncNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync cada vez que se recupera la conexión (transición offline -> online).
  useEffect(() => {
    let wasOffline = false;
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      if (online && wasOffline) {
        syncNow();
      }
      wasOffline = !online;
    });
    return () => unsubscribe();
  }, [syncNow]);

  return { isSyncing, isOnline, lastSyncAt, lastError, pendingCount, syncNow };
}
