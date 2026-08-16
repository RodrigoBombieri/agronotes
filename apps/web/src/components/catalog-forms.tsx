"use client";

import { useActionState, useRef, useState } from "react";
import { initialActionState, type ActionState } from "@/lib/actions/types";
import {
  archiveField,
  archivePlot,
  archiveTaskType,
  createField,
  createPlot,
  createTaskType,
  renameField,
  updatePlot,
  updateTaskType,
} from "@/lib/actions/catalog";

// apps/web/src/components/catalog-forms.tsx — Etapa 6 (2026-08-16).
//
// Formularios del ABM de catálogo. Están todos juntos en un archivo porque
// comparten los mismos estilos y el mismo patrón, y separarlos en seis
// archivos de veinte líneas no aportaría nada.
//
// **Patrón importante — dónde se hace el efecto secundario.** Después de un
// alta hay que limpiar el formulario, y después de una edición hay que
// cerrar el modo edición. Las dos cosas se hacen **envolviendo la Server
// Action en una función cliente** que mira el resultado, y no en un
// `useEffect` ni ajustando estado durante el render:
//   - Con `useEffect` + `setState`, el lint de react-hooks lo marca
//     (`set-state-in-effect`) porque dispara renders en cascada.
//   - Ajustando estado durante el render, React tira "Cannot update a
//     component (Router) while rendering a different component", porque el
//     `revalidatePath` de la action ya está actualizando el Router en ese
//     mismo momento.
// La función que envuelve corre dentro de la transición de la action, que
// es el lugar correcto para llamar a setState.

const inputClass =
  "rounded-xl border-2 border-line bg-white px-3 py-2 text-sm font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500";
const primaryButtonClass =
  "rounded-xl bg-brand-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-brand-700 disabled:opacity-60";
const linkButtonClass =
  "rounded-lg px-2 py-1 text-xs font-extrabold text-brand-700 hover:bg-brand-50 disabled:opacity-60";
const dangerLinkClass =
  "rounded-lg px-2 py-1 text-xs font-extrabold text-danger hover:bg-danger-bg disabled:opacity-60";

type ServerAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-sm font-bold text-danger">
      {message}
    </p>
  );
}

/** Alta: si sale bien, limpia el formulario para poder cargar el siguiente. */
function useCreateForm(action: ServerAction) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await action(prev, formData);
      if (result.ok) formRef.current?.reset();
      return result;
    },
    initialActionState,
  );

  return { formRef, state, formAction, pending };
}

/** Edición de una fila: si sale bien, cierra el modo edición. */
function useRowEditor(action: ServerAction) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await action(prev, formData);
      if (result.ok) setEditing(false);
      return result;
    },
    initialActionState,
  );

  return { editing, setEditing, state, formAction, pending };
}

// ---------------------------------------------------------------- campos

export function CreateFieldForm() {
  const { formRef, state, formAction, pending } = useCreateForm(createField);

  return (
    <div>
      <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nuevo-campo" className="text-xs font-bold text-ink-muted">
            Nombre del campo
          </label>
          <input
            id="nuevo-campo"
            name="name"
            required
            maxLength={120}
            placeholder="La Esperanza"
            className={inputClass}
          />
        </div>
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Agregando…" : "Agregar campo"}
        </button>
      </form>
      <ErrorText message={state.error} />
    </div>
  );
}

export function FieldRowActions({ id, name }: { id: string; name: string }) {
  const { editing, setEditing, state, formAction, pending } = useRowEditor(renameField);
  const [archiveState, archiveAction, archiving] = useActionState(
    archiveField,
    initialActionState,
  );

  if (editing) {
    return (
      <div>
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={id} />
          <input
            name="name"
            defaultValue={name}
            required
            maxLength={120}
            aria-label={`Nuevo nombre para ${name}`}
            className={inputClass}
          />
          <button type="submit" disabled={pending} className={linkButtonClass}>
            {pending ? "Guardando…" : "Guardar"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className={linkButtonClass}>
            Cancelar
          </button>
        </form>
        <ErrorText message={state.error} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <button type="button" onClick={() => setEditing(true)} className={linkButtonClass}>
        Renombrar
      </button>
      <form
        action={archiveAction}
        onSubmit={(event) => {
          if (
            !confirm(
              `¿Dar de baja el campo "${name}"? Sus lotes también se dan de baja y deja de contar para el monto de la suscripción. Las tareas ya registradas se conservan.`,
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button type="submit" disabled={archiving} className={dangerLinkClass}>
          {archiving ? "Dando de baja…" : "Dar de baja"}
        </button>
      </form>
      <ErrorText message={archiveState.error} />
    </div>
  );
}

// ----------------------------------------------------------------- lotes

export function CreatePlotForm({ fieldId }: { fieldId: string }) {
  const { formRef, state, formAction, pending } = useCreateForm(createPlot);

  return (
    <div>
      <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="fieldId" value={fieldId} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nuevo-lote" className="text-xs font-bold text-ink-muted">
            Nombre del lote
          </label>
          <input
            id="nuevo-lote"
            name="name"
            required
            maxLength={120}
            placeholder="Lote 4"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nuevo-lote-ha" className="text-xs font-bold text-ink-muted">
            Hectáreas (opcional)
          </label>
          <input
            id="nuevo-lote-ha"
            name="hectares"
            inputMode="decimal"
            placeholder="35,5"
            className={`${inputClass} w-32`}
          />
        </div>
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Agregando…" : "Agregar lote"}
        </button>
      </form>
      <ErrorText message={state.error} />
    </div>
  );
}

export function PlotRowActions({
  id,
  fieldId,
  name,
  hectares,
}: {
  id: string;
  fieldId: string;
  name: string;
  hectares: number | null;
}) {
  const { editing, setEditing, state, formAction, pending } = useRowEditor(updatePlot);
  const [archiveState, archiveAction, archiving] = useActionState(archivePlot, initialActionState);

  if (editing) {
    return (
      <div>
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="fieldId" value={fieldId} />
          <input
            name="name"
            defaultValue={name}
            required
            maxLength={120}
            aria-label={`Nuevo nombre para ${name}`}
            className={inputClass}
          />
          <input
            name="hectares"
            defaultValue={hectares ?? ""}
            inputMode="decimal"
            aria-label={`Hectáreas de ${name}`}
            className={`${inputClass} w-28`}
          />
          <button type="submit" disabled={pending} className={linkButtonClass}>
            {pending ? "Guardando…" : "Guardar"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className={linkButtonClass}>
            Cancelar
          </button>
        </form>
        <ErrorText message={state.error} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <button type="button" onClick={() => setEditing(true)} className={linkButtonClass}>
        Editar
      </button>
      <form
        action={archiveAction}
        onSubmit={(event) => {
          if (
            !confirm(
              `¿Dar de baja el lote "${name}"? Deja de aparecer en la app para cargar tareas nuevas. Las tareas ya registradas se conservan.`,
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="fieldId" value={fieldId} />
        <button type="submit" disabled={archiving} className={dangerLinkClass}>
          {archiving ? "Dando de baja…" : "Dar de baja"}
        </button>
      </form>
      <ErrorText message={archiveState.error} />
    </div>
  );
}

// -------------------------------------------------------- tipos de tarea

export function CreateTaskTypeForm() {
  const { formRef, state, formAction, pending } = useCreateForm(createTaskType);

  return (
    <div>
      <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nuevo-tipo" className="text-xs font-bold text-ink-muted">
            Nombre del tipo
          </label>
          <input
            id="nuevo-tipo"
            name="name"
            required
            maxLength={120}
            placeholder="Pulverización"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nuevo-tipo-unidad" className="text-xs font-bold text-ink-muted">
            Unidad por defecto
          </label>
          <input
            id="nuevo-tipo-unidad"
            name="defaultUnit"
            required
            maxLength={40}
            placeholder="litros"
            className={`${inputClass} w-40`}
          />
        </div>
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Agregando…" : "Agregar tipo"}
        </button>
      </form>
      <ErrorText message={state.error} />
    </div>
  );
}

export function TaskTypeRowActions({
  id,
  name,
  defaultUnit,
}: {
  id: string;
  name: string;
  defaultUnit: string;
}) {
  const { editing, setEditing, state, formAction, pending } = useRowEditor(updateTaskType);
  const [archiveState, archiveAction, archiving] = useActionState(
    archiveTaskType,
    initialActionState,
  );

  if (editing) {
    return (
      <div>
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={id} />
          <input
            name="name"
            defaultValue={name}
            required
            maxLength={120}
            aria-label={`Nuevo nombre para ${name}`}
            className={inputClass}
          />
          <input
            name="defaultUnit"
            defaultValue={defaultUnit}
            required
            maxLength={40}
            aria-label={`Unidad por defecto de ${name}`}
            className={`${inputClass} w-32`}
          />
          <button type="submit" disabled={pending} className={linkButtonClass}>
            {pending ? "Guardando…" : "Guardar"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className={linkButtonClass}>
            Cancelar
          </button>
        </form>
        <ErrorText message={state.error} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <button type="button" onClick={() => setEditing(true)} className={linkButtonClass}>
        Editar
      </button>
      <form
        action={archiveAction}
        onSubmit={(event) => {
          if (
            !confirm(
              `¿Dar de baja el tipo "${name}"? Deja de ofrecerse al cargar tareas nuevas. Las tareas ya registradas con este tipo se conservan.`,
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button type="submit" disabled={archiving} className={dangerLinkClass}>
          {archiving ? "Dando de baja…" : "Dar de baja"}
        </button>
      </form>
      <ErrorText message={archiveState.error} />
    </div>
  );
}
