"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type DockPosition = "right" | "left" | "float";

export const MIN_INSPECTOR_WIDTH = 260;
export const MAX_INSPECTOR_WIDTH = 640;
export const DEFAULT_INSPECTOR_WIDTH = 320;
export const MIN_INSPECTOR_HEIGHT = 200;

interface InspectorDockContextValue {
  dock: DockPosition;
  setDock: (dock: DockPosition) => void;
  x: number;
  y: number;
  setPosition: (pos: { x: number; y: number }) => void;
  width: number;
  setWidth: (width: number) => void;
  height?: number;
  setHeight: (height: number | undefined) => void;
  minimized: boolean;
  setMinimized: (minimized: boolean | ((prev: boolean) => boolean)) => void;
  toggleMinimized: () => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  snapCandidate: "right" | "left" | null;
  setSnapCandidate: (snap: "right" | "left" | null) => void;
}

const STORAGE_KEY = "cms_inspector_dock_v1";

const InspectorDockContext = createContext<InspectorDockContextValue | null>(null);

export function useInspectorDock() {
  const ctx = useContext(InspectorDockContext);
  if (!ctx) {
    // Retornar valores por defecto seguros si se usa fuera del proveedor
    return {
      dock: "right" as DockPosition,
      setDock: () => {},
      x: 100,
      y: 20,
      setPosition: () => {},
      width: DEFAULT_INSPECTOR_WIDTH,
      setWidth: () => {},
      height: undefined,
      setHeight: () => {},
      minimized: false,
      setMinimized: () => {},
      toggleMinimized: () => {},
      isDragging: false,
      setIsDragging: () => {},
      snapCandidate: null,
      setSnapCandidate: () => {},
    };
  }
  return ctx;
}

export function InspectorDockProvider({ children }: { children: ReactNode }) {
  const [dock, setDockState] = useState<DockPosition>("right");
  const [x, setX] = useState(80);
  const [y, setY] = useState(20);
  const [width, setWidthState] = useState(DEFAULT_INSPECTOR_WIDTH);
  const [height, setHeightState] = useState<number | undefined>(undefined);
  const [minimized, setMinimizedState] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [snapCandidate, setSnapCandidate] = useState<"right" | "left" | null>(null);

  // Cargar preferencias guardadas en cliente
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.dock === "right" || parsed.dock === "left" || parsed.dock === "float") {
          setDockState(parsed.dock);
        }
        if (typeof parsed.x === "number") setX(parsed.x);
        if (typeof parsed.y === "number") setY(parsed.y);
        if (typeof parsed.width === "number") {
          setWidthState(Math.min(MAX_INSPECTOR_WIDTH, Math.max(MIN_INSPECTOR_WIDTH, parsed.width)));
        }
        if (typeof parsed.height === "number") setHeightState(parsed.height);
        if (typeof parsed.minimized === "boolean") setMinimizedState(parsed.minimized);
      }
    } catch {
      // Ignorar errores de lectura en entornos restringidos
    }
  }, []);

  // Persistir cambios
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ dock, x, y, width, height, minimized }),
      );
    } catch {
      // Ignorar errores de escritura
    }
  }, [dock, x, y, width, height, minimized]);

  const setDock = useCallback((next: DockPosition) => {
    setDockState(next);
  }, []);

  const setPosition = useCallback((pos: { x: number; y: number }) => {
    setX(pos.x);
    setY(pos.y);
  }, []);

  const setWidth = useCallback((nextWidth: number) => {
    setWidthState(Math.min(MAX_INSPECTOR_WIDTH, Math.max(MIN_INSPECTOR_WIDTH, nextWidth)));
  }, []);

  const setHeight = useCallback((nextHeight: number | undefined) => {
    if (nextHeight === undefined) {
      setHeightState(undefined);
    } else {
      setHeightState(Math.max(MIN_INSPECTOR_HEIGHT, nextHeight));
    }
  }, []);

  const setMinimized = useCallback((val: boolean | ((prev: boolean) => boolean)) => {
    setMinimizedState(val);
  }, []);

  const toggleMinimized = useCallback(() => {
    setMinimizedState((prev) => !prev);
  }, []);

  return (
    <InspectorDockContext
      value={{
        dock,
        setDock,
        x,
        y,
        setPosition,
        width,
        setWidth,
        height,
        setHeight,
        minimized,
        setMinimized,
        toggleMinimized,
        isDragging,
        setIsDragging,
        snapCandidate,
        setSnapCandidate,
      }}
    >
      {children}
    </InspectorDockContext>
  );
}
