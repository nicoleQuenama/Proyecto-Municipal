"use client";

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

/** A qué se aplican los cambios hechos en la página: solo al bloque que se edita, o a todos los del componente. */
export type EditScope = "block" | "component";

/** Lo que el usuario eligió ver y usar al editar un lienzo. */
export interface CanvasSettings {
  /** Dibuja la cuadrícula (y los elementos también se pegan a ella). */
  grid: boolean;
  /** Los elementos se pegan a las guías de los demás. */
  snap: boolean;
  scope: EditScope;
}

interface SettingsValue {
  settings: CanvasSettings;
  setSettings: Dispatch<SetStateAction<CanvasSettings>>;
}

const SettingsContext = createContext<SettingsValue | null>(null);

export function useCanvasSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("Debe usarse dentro de <CanvasSettingsProvider>");
  return ctx;
}

/** Las mismas opciones valen en la página y en el constructor de componentes. */
export function CanvasSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CanvasSettings>({ grid: true, snap: true, scope: "block" });
  return <SettingsContext value={{ settings, setSettings }}>{children}</SettingsContext>;
}
