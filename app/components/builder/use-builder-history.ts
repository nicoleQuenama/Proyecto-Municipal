"use client";

import { useCallback, useState } from "react";
import type { ComponentDef } from "../site/types";
import { builderReducer } from "./builder-reducer";
import { initialBuilderState, type BuilderAction, type BuilderState } from "./builder-types";

interface HistoryBuilderState {
  past: BuilderState[];
  present: BuilderState;
  future: BuilderState[];
  lastAt: number;
  lastType: string | null;
}

const MAX_HISTORY = 60;
const COALESCE_MS = 600;

/** Hook que maneja el estado del constructor de componentes con soporte para Deshacer (Ctrl+Z) y Rehacer (Ctrl+Y). */
export function useBuilderHistory(initial?: ComponentDef) {
  const [history, setHistory] = useState<HistoryBuilderState>(() => {
    const present = initialBuilderState(initial);
    return { past: [], present, future: [], lastAt: 0, lastType: null };
  });

  const dispatch = useCallback((action: BuilderAction) => {
    setHistory((current) => {
      if (action.type === "select") {
        // Seleccionar no es un cambio del diseño: no entra en el historial.
        return { ...current, present: builderReducer(current.present, action) };
      }

      const next = builderReducer(current.present, action);
      if (next === current.present) return current;

      const now = Date.now();
      const sameGesture =
        current.past.length > 0 && current.lastType === action.type && now - current.lastAt < COALESCE_MS;

      const past = sameGesture ? current.past : [...current.past, current.present].slice(-MAX_HISTORY);

      return {
        past,
        present: next,
        future: [],
        lastAt: now,
        lastType: action.type,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((current) => {
      const previous = current.past.at(-1);
      if (!previous) return current;
      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future],
        lastAt: 0,
        lastType: null,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => {
      const [next, ...remaining] = current.future;
      if (!next) return current;
      return {
        past: [...current.past, current.present],
        present: next,
        future: remaining,
        lastAt: 0,
        lastType: null,
      };
    });
  }, []);

  return {
    state: history.present,
    dispatch,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undoCount: history.past.length,
    redoCount: history.future.length,
  };
}
