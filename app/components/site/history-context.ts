"use client";

import { createContext, useContext } from "react";

export interface HistoryControls {
  undo: () => void;
  redo: () => void;
  /** Cuántos pasos se pueden deshacer y cuántos rehacer. */
  undoCount: number;
  redoCount: number;
}

const NONE: HistoryControls = { undo: () => {}, redo: () => {}, undoCount: 0, redoCount: 0 };

export const HistoryContext = createContext<HistoryControls>(NONE);

export const useHistoryControls = (): HistoryControls => useContext(HistoryContext);
