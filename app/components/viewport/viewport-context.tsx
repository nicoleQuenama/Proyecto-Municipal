"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

import { DEVICE_WIDTH, type Device } from "../responsive/devices";

export type { Device };

export type Tool =
  | "select"
  | "hand"
  | "frame"
  | "text"
  | "icon"
  | "gradient"
  | "comment"
  | "rectangle"
  | "ellipse"
  | "line"
  | "triangle";

export const DEVICES: { value: Device; label: string; width: number }[] = [
  { value: "desktop", label: "Escritorio", width: DEVICE_WIDTH.desktop },
  { value: "tablet", label: "Tablet", width: DEVICE_WIDTH.tablet },
  { value: "mobile", label: "Móvil", width: DEVICE_WIDTH.mobile },
];

export const ZOOM_STEPS = [10, 15, 25, 50, 75, 100, 125, 150, 200, 300];

interface ViewportContextValue {
  device: Device;
  setDevice: (device: Device) => void;
  tool: Tool;
  setTool: (tool: Tool) => void;
  zoom: number;
  /** Fija el zoom a mano: deja de ajustarse solo a la ventana. */
  setZoom: (zoom: number) => void;
  stepZoom: (direction: 1 | -1) => void;
  /** Mientras es true, el zoom lo calcula el lienzo para que quepan todas las páginas. */
  fitted: boolean;
  fitToWindow: () => void;
  /** Lo usa el lienzo para aplicar el zoom calculado sin desactivar el ajuste. */
  applyFittedZoom: (zoom: number) => void;
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
  const [zoom, setZoomState] = useState(100);
  const [fitted, setFitted] = useState(true);

  const setZoom = useCallback((next: number) => {
    setFitted(false);
    setZoomState(next);
  }, []);

  const fitToWindow = useCallback(() => setFitted(true), []);

  const stepZoom = useCallback(
    (direction: 1 | -1) => {
      const next =
        direction === 1
          ? ZOOM_STEPS.find((z) => z > zoom)
          : [...ZOOM_STEPS].reverse().find((z) => z < zoom);
      if (next !== undefined) setZoom(next);
    },
    [zoom, setZoom],
  );

  return (
    <ViewportContext
      value={{
        device,
        setDevice,
        tool,
        setTool,
        zoom,
        setZoom,
        stepZoom,
        fitted,
        fitToWindow,
        applyFittedZoom: setZoomState,
      }}
    >
      {children}
    </ViewportContext>
  );
}
