// Estado compartido entre los 3 pasos de "Nueva tarea". Vive en un context
// scoped al stack de nueva-tarea (se monta/desmonta con él, así que cada
// vez que se entra al flujo arranca limpio) — no en la app entera.

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type WizardState = {
  plotId: string | null;
  taskTypeId: string | null;
  quantity: string;
  unit: string;
  note: string;
};

type WizardContextValue = WizardState & {
  setPlot: (plotId: string) => void;
  setTaskType: (taskTypeId: string, defaultUnit: string | null) => void;
  setQuantity: (quantity: string) => void;
  setUnit: (unit: string) => void;
  setNote: (note: string) => void;
  reset: () => void;
};

const initialState: WizardState = {
  plotId: null,
  taskTypeId: null,
  quantity: "",
  unit: "",
  note: "",
};

const WizardContext = createContext<WizardContextValue | null>(null);

export function NewTaskWizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WizardState>(initialState);

  const value = useMemo<WizardContextValue>(
    () => ({
      ...state,
      setPlot: (plotId) => setState((s) => ({ ...s, plotId })),
      setTaskType: (taskTypeId, defaultUnit) =>
        setState((s) => ({ ...s, taskTypeId, unit: defaultUnit ?? s.unit })),
      setQuantity: (quantity) => setState((s) => ({ ...s, quantity })),
      setUnit: (unit) => setState((s) => ({ ...s, unit })),
      setNote: (note) => setState((s) => ({ ...s, note })),
      reset: () => setState(initialState),
    }),
    [state],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useNewTaskWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useNewTaskWizard debe usarse dentro de <NewTaskWizardProvider>");
  return ctx;
}
