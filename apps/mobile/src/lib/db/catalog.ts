// Cacheo local del catálogo (campos, lotes, tipos de tarea). Es de solo
// lectura desde la perspectiva del dispositivo: se pisa entero en cada pull
// de sync (replace-all), nunca se edita localmente. Así el formulario de
// "Nueva tarea" siempre tiene opciones para elegir aunque no haya señal,
// usando la última foto que se bajó.

import type { SQLiteDatabase } from "expo-sqlite";
import type { Field, Plot, TaskType } from "@/lib/types";

export async function replaceCatalog(
  db: SQLiteDatabase,
  data: { fields: Field[]; plots: Plot[]; taskTypes: TaskType[] },
) {
  await db.withTransactionAsync(async () => {
    await db.execAsync(
      "DELETE FROM fields; DELETE FROM plots; DELETE FROM task_types;",
    );

    for (const field of data.fields) {
      await db.runAsync("INSERT INTO fields (id, name) VALUES (?, ?)", [
        field.id,
        field.name,
      ]);
    }

    for (const plot of data.plots) {
      await db.runAsync(
        "INSERT INTO plots (id, field_id, name, hectares) VALUES (?, ?, ?, ?)",
        [plot.id, plot.field_id, plot.name, plot.hectares],
      );
    }

    for (const taskType of data.taskTypes) {
      await db.runAsync(
        "INSERT INTO task_types (id, name, default_unit) VALUES (?, ?, ?)",
        [taskType.id, taskType.name, taskType.default_unit],
      );
    }
  });
}

export async function getFields(db: SQLiteDatabase): Promise<Field[]> {
  return db.getAllAsync<Field>("SELECT * FROM fields ORDER BY name");
}

export async function getPlots(
  db: SQLiteDatabase,
  fieldId?: string,
): Promise<Plot[]> {
  if (fieldId) {
    return db.getAllAsync<Plot>(
      "SELECT * FROM plots WHERE field_id = ? ORDER BY name",
      [fieldId],
    );
  }
  return db.getAllAsync<Plot>("SELECT * FROM plots ORDER BY name");
}

export async function getTaskTypes(db: SQLiteDatabase): Promise<TaskType[]> {
  return db.getAllAsync<TaskType>("SELECT * FROM task_types ORDER BY name");
}

export async function hasCatalog(db: SQLiteDatabase): Promise<boolean> {
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM plots",
  );
  return (row?.count ?? 0) > 0;
}
