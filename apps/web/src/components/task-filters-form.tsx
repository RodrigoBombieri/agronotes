import type { FilterOptions } from "@/lib/queries/tasks";

type Props = {
  options: FilterOptions;
  current: {
    campo?: string;
    lote?: string;
    tipo?: string;
    usuario?: string;
    desde?: string;
    hasta?: string;
  };
};

export function TaskFiltersForm({ options, current }: Props) {
  return (
    <form method="get" className="mb-6 flex flex-wrap items-end gap-3" aria-label="Filtros de tareas">
      <div className="flex flex-col gap-1">
        <label htmlFor="campo" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          Campo
        </label>
        <select
          id="campo"
          name="campo"
          defaultValue={current.campo ?? ""}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="">Todos</option>
          {options.fields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="lote" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          Lote
        </label>
        <select
          id="lote"
          name="lote"
          defaultValue={current.lote ?? ""}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="">Todos</option>
          {options.plots.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tipo" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          Tipo de tarea
        </label>
        <select
          id="tipo"
          name="tipo"
          defaultValue={current.tipo ?? ""}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="">Todos</option>
          {options.taskTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="usuario" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          Usuario
        </label>
        <select
          id="usuario"
          name="usuario"
          defaultValue={current.usuario ?? ""}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="">Todos</option>
          {options.users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="desde" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          Desde
        </label>
        <input
          id="desde"
          name="desde"
          type="date"
          defaultValue={current.desde ?? ""}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="hasta" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          Hasta
        </label>
        <input
          id="hasta"
          name="hasta"
          type="date"
          defaultValue={current.hasta ?? ""}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Aplicar filtros
        </button>
        <a
          href="/tareas"
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          Limpiar
        </a>
      </div>
    </form>
  );
}
