// Motor de sincronización. Dos direcciones, siempre en este orden:
//   1) pull del catálogo (fields/plots/task_types) — barato, siempre se
//      hace primero para que el push de abajo tenga contra qué validar.
//   2) push de tareas pendientes — upsert por id (PK generada en el
//      dispositivo), da idempotencia real: reintentar un push que ya se
//      aplicó no duplica nada ni pisa mal un dato, porque el id es el mismo.
//
// No hay cola con reintentos exponenciales ni nada sofisticado para el MVP:
// se corre este ciclo cuando (a) la app arranca con conexión, (b) NetInfo
// detecta que se recuperó la conexión, (c) el usuario fuerza un refresh
// desde la UI. Si una tarea falla por un error real (no de red), queda en
// sync_status='error' y no se reintenta sola — se reintenta la próxima vez
// que corra el ciclo completo (si el error era transitorio, va a pasar; si
// no, se ve reflejado en la UI para que el usuario revise).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SQLiteDatabase } from "expo-sqlite";
import type { Database } from "@/lib/database.types";
import { getPendingTasks, markTaskSynced, markTaskSyncError } from "@/lib/db/tasks";
import { replaceCatalog } from "@/lib/db/catalog";

export type SyncResult = {
  pulled: boolean;
  pushed: number;
  failed: number;
};

/**
 * Lo que el dispositivo manda al servidor por cada tarea. Es el Insert
 * generado por Supabase **menos `organization_id`**, que a propósito no se
 * manda nunca: lo completa el trigger `tasks_set_organization` a partir del
 * lote (decisión de Etapa 2 — el cliente no puede falsear a qué organización
 * pertenece una tarea). Los tipos generados no saben de triggers y lo marcan
 * como obligatorio, de ahí el cast puntual en el upsert de abajo; el resto
 * de los campos sí queda tipado contra el esquema real.
 */
type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
type TaskUpsertPayload = Omit<TaskInsert, "organization_id">;

export async function runSync(
  db: SQLiteDatabase,
  supabase: SupabaseClient<Database>,
): Promise<SyncResult> {
  let pulled = false;
  try {
    await pullCatalog(db, supabase);
    pulled = true;
  } catch {
    // Sin conexión (o el server no responde): seguimos igual al push de
    // pendientes de abajo, que puede fallar también, pero no bloqueamos
    // el pull por el push ni viceversa — son independientes.
  }

  const { pushed, failed } = await pushPendingTasks(db, supabase);

  return { pulled, pushed, failed };
}

async function pullCatalog(
  db: SQLiteDatabase,
  supabase: SupabaseClient<Database>,
) {
  const [{ data: fields, error: fieldsError }, { data: plots, error: plotsError }, { data: taskTypes, error: taskTypesError }] =
    await Promise.all([
      supabase.from("fields").select("id, name").is("deleted_at", null),
      supabase.from("plots").select("id, field_id, name, hectares").is("deleted_at", null),
      supabase.from("task_types").select("id, name, default_unit"),
    ]);

  if (fieldsError) throw fieldsError;
  if (plotsError) throw plotsError;
  if (taskTypesError) throw taskTypesError;

  await replaceCatalog(db, {
    fields: fields ?? [],
    plots: plots ?? [],
    taskTypes: taskTypes ?? [],
  });
}

async function pushPendingTasks(
  db: SQLiteDatabase,
  supabase: SupabaseClient<Database>,
): Promise<{ pushed: number; failed: number }> {
  const pending = await getPendingTasks(db);
  let pushed = 0;
  let failed = 0;

  for (const task of pending) {
    // `deleted_at` viaja igual que cualquier otro campo: una anulación hecha
    // en el celular es, para el servidor, un upsert más sobre la misma fila
    // que le pone la marca de borrado lógico. Por eso getPendingTasks() no
    // filtra las anuladas — si lo hiciera, quedarían borradas solo en el
    // dispositivo (Etapa 6, 2026-08-16).
    const payload: TaskUpsertPayload = {
      id: task.id,
      plot_id: task.plot_id,
      task_type_id: task.task_type_id,
      user_id: task.user_id,
      quantity: task.quantity,
      unit: task.unit,
      note: task.note,
      occurred_at: task.occurred_at,
      deleted_at: task.deleted_at,
    };

    const { error } = await supabase
      .from("tasks")
      .upsert(payload as TaskInsert, { onConflict: "id" });

    if (error) {
      failed += 1;
      // Errores de red (fetch failed, timeout) vs errores reales del server
      // (validación, RLS) no se distinguen acá con precisión — Supabase-js
      // no siempre expone eso con claridad en React Native. Una excepción:
      // el código 42501 de Postgres es siempre una violación de RLS (por
      // ejemplo, el modo solo lectura por suscripción vencida, Etapa 6,
      // 2026-08-16) — para ese caso puntual mostramos un mensaje más claro
      // que el texto crudo de Postgres. El resto se guarda tal cual para
      // que se vea en el indicador de sync; el usuario o el próximo ciclo
      // lo reintentan igual.
      const message =
        error.code === "42501"
          ? "No se pudo guardar: sin permiso (revisá el estado de la suscripción de tu organización)."
          : error.message;
      await markTaskSyncError(db, task.id, message);
      continue;
    }

    pushed += 1;
    await markTaskSynced(db, task.id);
  }

  return { pushed, failed };
}
