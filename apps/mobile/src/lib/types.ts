// Tipos compartidos entre la capa local (SQLite) y Supabase.
// Reflejan el modelo de datos de Etapa 2 (ver planificador.md), acotado a lo
// que el dispositivo necesita tener cacheado localmente para funcionar
// offline: catálogo (fields/plots/task_types) + tareas propias.

export type Field = {
  id: string;
  name: string;
};

export type Plot = {
  id: string;
  field_id: string;
  name: string;
  hectares: number | null;
};

export type TaskType = {
  id: string;
  name: string;
  default_unit: string | null;
};

/**
 * Estado de sincronización de una fila local. Nunca viaja al servidor —
 * es puramente para que la UI del dispositivo sepa qué mostrar.
 *   pending: creada/editada localmente, todavía no confirmada por el server.
 *   synced: el servidor ya la tiene tal cual está acá.
 *   error: el último intento de sync falló (no de red — un error real, p.ej.
 *          validación); no se reintenta en loop, se reintenta en el próximo
 *          ciclo de sync manual o cuando el usuario la vuelve a tocar.
 */
export type SyncStatus = "pending" | "synced" | "error";

export type LocalTask = {
  id: string; // UUID generado en el dispositivo — es la PK real, también en el servidor.
  plot_id: string;
  task_type_id: string;
  user_id: string;
  quantity: number;
  unit: string;
  note: string | null;
  occurred_at: string; // ISO 8601
  /**
   * Soft delete (anulación). Si tiene fecha, la tarea está anulada: no se
   * muestra en Home/Historial, pero sigue existiendo localmente y se
   * sincroniza como anulación al servidor. Nunca se borra en duro — misma
   * regla que en la base (ver "Decisiones clave" del planificador).
   */
  deleted_at: string | null;
  sync_status: SyncStatus;
  sync_error: string | null;
  updated_at: string; // ISO 8601, para saber qué es "lo último" en la UI local.
};

export type NewTaskInput = {
  plot_id: string;
  task_type_id: string;
  quantity: number;
  unit: string;
  note: string | null;
  occurred_at: string;
};

/**
 * Campos editables de una tarea ya registrada. Es el mismo conjunto que
 * `NewTaskInput` a propósito: desde el mobile se puede corregir cualquier
 * dato de la tarea (incluido el lote y el tipo), porque el caso real es
 * "me equivoqué de lote al cargar". Lo que no se toca nunca es el `id` ni
 * el `user_id` — eso rompería la idempotencia del upsert y la autoría.
 */
export type EditTaskInput = NewTaskInput;
