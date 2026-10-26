"use client";

import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { useAutosave } from "../persistence/use-autosave";
import { INITIAL_STATE } from "./initial-state";
import type { VersioningAction, VersioningState } from "./types";
import { useDesignSnapshot } from "./use-design-snapshot";
import { versioningReducer } from "./versioning-reducer";

interface VersioningContextValue {
  state: VersioningState;
  dispatch: Dispatch<VersioningAction>;
}

const VersioningContext = createContext<VersioningContextValue | null>(null);

export function useVersioning() {
  const ctx = useContext(VersioningContext);
  if (!ctx) throw new Error("Debe usarse dentro de <VersioningProvider>");
  return ctx;
}

export function VersioningProvider({ children }: { children: ReactNode }) {
  // Al iniciar, el diseño que se ve en el lienzo es la versión guardada de partida.
  const initialDesign = useDesignSnapshot();
  const [state, dispatch] = useReducer(versioningReducer, initialDesign, (baseline) => ({
    ...INITIAL_STATE,
    baseline,
  }));
  useAutosave<VersioningState>("versions", state, (saved) => dispatch({ type: "project/load", state: saved }));

  return <VersioningContext value={{ state, dispatch }}>{children}</VersioningContext>;
}
