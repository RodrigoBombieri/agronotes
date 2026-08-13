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

const selectClass =
  "rounded-lg border-2 border-line bg-white px-2.5 py-1.5 text-sm font-semibold text-ink";
const inputClass = selectClass;
const labelClass = "text-xs font-extrabold text-ink-muted";

export function TaskFiltersForm({ options, current }: Props) {
  return (
    <form method="get" className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm" aria-label="Filtros de tareas">
      <div className="flex flex-col gap-1">
        <label htmlFor="campo" className={labelClass}>
          Campo
        </label>
        <select id="campo" name="campo" defaultValue={current.campo ?? ""} className={selectClass}>
          <option value="">Todos</option>
          {options.fields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="lote" className={labelClass}>
          Lote
        </label>
        <select id="lote" name="lote" defaultValue={current.lote ?? ""} className={selectClass}>
          <option value="">Todos</option>
          {options.plots.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tipo" className={labelClass}>
          Tipo de tarea
        </label>
        <select id="tipo" name="tipo" defaultValue={current.tipo ?? ""} className={selectClass}>
          <option value="">Todos</option>
          {options.taskTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="usuario" className={labelClass}>
          Usuario
        </label>
        <select id="usuario" name="usuario" defaultValue={current.usuario ?? ""} className={selectClass}>
          <option value="">Todos</option>
          {options.users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="desde" className={labelClass}>
          Desde
        </label>
        <input id="desde" name="desde" type="date" defaultValue={current.desde ?? ""} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="hasta" className={labelClass}>
          Hasta
        </label>
        <input id="hasta" name="hasta" type="date" defaultValue={current.hasta ?? ""} className={inputClass} />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-brand-900 px-3 py-1.5 text-sm font-extrabold text-white hover:bg-brand-700"
        >
          Aplicar filtros
        </button>
        <a
          href="/tareas"
          className="rounded-lg border-2 border-line px-3 py-1.5 text-sm font-bold text-ink-muted hover:bg-brand-50"
        >
          Limpiar
        </a>
      </div>
    </form>
  );
}
