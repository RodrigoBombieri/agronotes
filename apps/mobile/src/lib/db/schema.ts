// Esquema SQLite local. Espeja el subconjunto de la base de Supabase que el
// dispositivo necesita para funcionar 100% offline: catálogo de campos/
// lotes/tipos de tarea (solo lectura, se refresca en cada sync) y las
// tareas que el usuario va registrando (con id generado acá mismo).
//
// Importante — coherencia con la decisión de Etapa 2: el `id` de una tarea
// se genera en el dispositivo (UUID) y ES la primary key, tanto acá como en
// el servidor. No hay `local_id` separado. Eso es lo que permite que el
// push de sync sea un simple upsert idempotente.

import type { SQLiteDatabase } from "expo-sqlite";

export const DB_NAME = "agronotes.db";

// user_version de SQLite como control de versión de esquema simple. Si se
// necesita agregar una columna a futuro, sumar un bloque más al if/else de
// migrateDbIfNeeded en vez de tocar el CREATE TABLE existente.
const SCHEMA_VERSION = 1;

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= SCHEMA_VERSION) return;

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS fields (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS plots (
      id TEXT PRIMARY KEY NOT NULL,
      field_id TEXT NOT NULL,
      name TEXT NOT NULL,
      hectares REAL
    );

    CREATE TABLE IF NOT EXISTS task_types (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      default_unit TEXT
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      plot_id TEXT NOT NULL,
      task_type_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      note TEXT,
      occurred_at TEXT NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      sync_error TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_sync_status ON tasks (sync_status);
    CREATE INDEX IF NOT EXISTS idx_tasks_occurred_at ON tasks (occurred_at);
    CREATE INDEX IF NOT EXISTS idx_plots_field_id ON plots (field_id);
  `);

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}
