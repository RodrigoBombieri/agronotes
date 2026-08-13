// CRUD local de tareas contra SQLite. Todo lo que registra el usuario pasa
// primero por acá — nunca se espera una respuesta de red antes de guardar
// (decisión clave de Etapa 1: la app nunca bloquea el registro por falta de
// conexión).

import * as Crypto from "expo-crypto";
import type { SQLiteDatabase } from "expo-sqlite";
import type { LocalTask, NewTaskInput } from "@/lib/types";

export async function insertLocalTask(
  db: SQLiteDatabase,
  userId: string,
  input: NewTaskInput,
): Promise<LocalTask> {
  const now = new Date().toISOString();
  const task: LocalTask = {
    id: Crypto.randomUUID(),
    plot_id: input.plot_id,
    task_type_id: input.task_type_id,
    user_id: userId,
    quantity: input.quantity,
    unit: input.unit,
    note: input.note,
    occurred_at: input.occurred_at,
    sync_status: "pending",
    sync_error: null,
    updated_at: now,
  };

  await db.runAsync(
    `INSERT INTO tasks (id, plot_id, task_type_id, user_id, quantity, unit, note, occurred_at, sync_status, sync_error, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      task.id,
      task.plot_id,
      task.task_type_id,
      task.user_id,
      task.quantity,
      task.unit,
      task.note,
      task.occurred_at,
      task.sync_status,
      task.sync_error,
      task.updated_at,
    ],
  );

  return task;
}

export async function getTasksForToday(
  db: SQLiteDatabase,
): Promise<LocalTask[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return db.getAllAsync<LocalTask>(
    `SELECT * FROM tasks WHERE occurred_at >= ? ORDER BY occurred_at DESC`,
    [startOfDay.toISOString()],
  );
}

export type TaskHistoryFilters = {
  plotId?: string;
  taskTypeId?: string;
  from?: string; // ISO date
  to?: string; // ISO date
};

export async function getTaskHistory(
  db: SQLiteDatabase,
  filters: TaskHistoryFilters = {},
): Promise<LocalTask[]> {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (filters.plotId) {
    clauses.push("plot_id = ?");
    params.push(filters.plotId);
  }
  if (filters.taskTypeId) {
    clauses.push("task_type_id = ?");
    params.push(filters.taskTypeId);
  }
  if (filters.from) {
    clauses.push("occurred_at >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    clauses.push("occurred_at <= ?");
    params.push(filters.to);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

  return db.getAllAsync<LocalTask>(
    `SELECT * FROM tasks ${where} ORDER BY occurred_at DESC LIMIT 500`,
    params,
  );
}

export async function getPendingTasks(
  db: SQLiteDatabase,
): Promise<LocalTask[]> {
  return db.getAllAsync<LocalTask>(
    `SELECT * FROM tasks WHERE sync_status IN ('pending', 'error') ORDER BY updated_at ASC`,
  );
}

export async function markTaskSynced(db: SQLiteDatabase, id: string) {
  await db.runAsync(
    `UPDATE tasks SET sync_status = 'synced', sync_error = NULL WHERE id = ?`,
    [id],
  );
}

export async function markTaskSyncError(
  db: SQLiteDatabase,
  id: string,
  message: string,
) {
  await db.runAsync(
    `UPDATE tasks SET sync_status = 'error', sync_error = ? WHERE id = ?`,
    [message, id],
  );
}

export async function countPendingTasks(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM tasks WHERE sync_status IN ('pending', 'error')`,
  );
  return row?.count ?? 0;
}
