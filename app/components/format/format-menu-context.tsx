"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Point } from "../navigation/types";

/** A qué se da formato: un elemento de un bloque o el bloque entero (sus textos y su caja). */
export type FormatTarget =
  | { kind: "element"; pageId: string; blockId: string; elementId: string }
  | { kind: "block"; pageId: string; blockId: string };

interface OpenMenu {
  target: FormatTarget;
  point: Point;
}

interface FormatMenuContextValue {
  menu: OpenMenu | null;
  openFormatMenu: (target: FormatTarget, point: Point) => void;
  closeFormatMenu: () => void;
}

const FormatMenuContext = createContext<FormatMenuContextValue | null>(null);

export function useFormatMenu() {
  const ctx = useContext(FormatMenuContext);
  if (!ctx) throw new Error("Debe usarse dentro de <FormatMenuProvider>");
  return ctx;
}

/** Guarda qué menú de clic derecho está abierto y dónde. */
export function FormatMenuProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<OpenMenu | null>(null);

  const openFormatMenu = useCallback((target: FormatTarget, point: Point) => setMenu({ target, point }), []);
  const closeFormatMenu = useCallback(() => setMenu(null), []);

  const value = useMemo(() => ({ menu, openFormatMenu, closeFormatMenu }), [menu, openFormatMenu, closeFormatMenu]);
  return <FormatMenuContext value={value}>{children}</FormatMenuContext>;
}
