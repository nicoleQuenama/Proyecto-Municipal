"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

/** Ver una sola página, o todas en fila como marcos de Figma. */
export type CanvasLayout = "single" | "all";

export type Device = "desktop" | "tablet" | "mobile";

export type Tool =
  | "select"
  | "hand"
  | "frame"
  | "text"
  | "comment"
  | "rectangle"
  | "ellipse"
  | "line"
  | "triangle";

export const DEVICES: { value: Device; label: string; width: number }[] = [
  { value: "desktop", label: "Escritorio", width: 1024 },
  { value: "tablet", label: "Tablet", width: 768 },
  { value: "mobile", label: "Móvil", width: 390 },
];

export const ZOOM_STEPS = [10, 15, 25, 50, 75, 100, 125, 150, 200, 300];

interface ViewportContextValue {
  device: Device;
  setDevice: (device: Device) => void;
  tool: Tool;
  setTool: (tool: Tool) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  stepZoom: (direction: 1 | -1) => void;
  layout: CanvasLayout;
  /** Al ver todas las páginas se recuerda el zoom anterior y se recupera al volver a una sola. */
  setLayout: (layout: CanvasLayout) => void;
}

const ViewportContext = createContext<ViewportContextValue | null>(null);

export function useViewport() {
  const ctx = useContext(ViewportContext);
  if (!ctx) throw new Error("Debe usarse dentro de <ViewportProvider>");
  return ctx;
}

export function ViewportProvider({ children }: { children: ReactNode }) {
  const [device, setDevice] = useState<Device>("desktop");
  const [tool, setTool] = useState<Tool>("select");
  const [zoom, setZoom] = useState(100);
  const [layout, setLayoutState] = useState<CanvasLayout>("single");
  const savedZoom = useRef(100);

  const setLayout = useCallback(
    (next: CanvasLayout) => {
      if (next === layout) return;
      if (next === "all") savedZoom.current = zoom;
      else setZoom(savedZoom.current);
      setLayoutState(next);
    },
    [layout, zoom],
  );

  const stepZoom = useCallback(
    (direction: 1 | -1) =>
      setZoom((current) => {
        const next =
          direction === 1
            ? ZOOM_STEPS.find((z) => z > current)
            : [...ZOOM_STEPS].reverse().find((z) => z < current);
        return next ?? current;
      }),
    [],
  );

  return (
    <ViewportContext
      value={{ device, setDevice, tool, setTool, zoom, setZoom, stepZoom, layout, setLayout }}
    >
      {children}
    </ViewportContext>
  );
}
