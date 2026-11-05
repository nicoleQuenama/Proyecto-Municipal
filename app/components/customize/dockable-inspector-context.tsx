"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePreference } from "../persistence/use-preference";

export type DockPosition = "right" | "float";

export const MIN_INSPECTOR_WIDTH = 260;
export const MAX_INSPECTOR_WIDTH = 640;
export const DEFAULT_INSPECTOR_WIDTH = 320;
export const MIN_INSPECTOR_HEIGHT = 200;
export const DOCKED_RAIL_WIDTH = 48;

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
  collapsed: boolean;
  setCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  toggleCollapsed: () => void;
  minimized: boolean;
  setMinimized: (minimized: boolean | ((prev: boolean) => boolean)) => void;
  toggleMinimized: () => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
}

const PREFERENCE = "editor.inspector-dock";

interface SavedDock {
  dock?: DockPosition;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  collapsed?: boolean;
}

const NOTHING_SAVED: SavedDock = {};

const InspectorDockContext = createContext<InspectorDockContextValue | null>(null);

export function useInspectorDock() {
  const ctx = useContext(InspectorDockContext);
  if (!ctx) {
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
      collapsed: false,
      setCollapsed: () => {},
      toggleCollapsed: () => {},
      minimized: false,
      setMinimized: () => {},
      toggleMinimized: () => {},
      isDragging: false,
      setIsDragging: () => {},
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
  const [collapsed, setCollapsedState] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // La disposición del inspector se guarda en la cuenta: al llegar lo guardado se aplica una vez, y después cada cambio se guarda.
  const [saved, save, ready] = usePreference<SavedDock>(PREFERENCE, NOTHING_SAVED);
  const applied = useRef(false);
  useEffect(() => {
    if (!ready || applied.current) return;
    applied.current = true;
    /* Se copia lo guardado en la cuenta al estado local, una sola vez, cuando llega. */
    /* eslint-disable react-hooks/set-state-in-effect */
    if (saved.dock === "right" || saved.dock === "float") setDockState(saved.dock);
    if (typeof saved.x === "number") setX(saved.x);
    if (typeof saved.y === "number") setY(saved.y);
    if (typeof saved.width === "number") setWidthState(Math.min(MAX_INSPECTOR_WIDTH, Math.max(MIN_INSPECTOR_WIDTH, saved.width)));
    if (typeof saved.height === "number") setHeightState(saved.height);
    if (typeof saved.collapsed === "boolean") setCollapsedState(saved.collapsed);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [ready, saved]);

  useEffect(() => {
    if (applied.current) save({ dock, x, y, width, height, collapsed });
  }, [dock, x, y, width, height, collapsed, save]);

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

  const setCollapsed = useCallback((val: boolean | ((prev: boolean) => boolean)) => {
    setCollapsedState(val);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((prev) => !prev);
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
        collapsed,
        setCollapsed,
        toggleCollapsed,
        minimized: collapsed,
        setMinimized: setCollapsed,
        toggleMinimized: toggleCollapsed,
        isDragging,
        setIsDragging,
      }}
    >
      {children}
    </InspectorDockContext>
  );
}
