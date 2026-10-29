"use client";

import type { ReactNode } from "react";
import { DesktopIcon, MobileIcon, TabletIcon } from "./icons";
import { DEVICES, useViewport, type Device } from "./viewport-context";

const DEVICE_ICONS: Record<Device, ReactNode> = {
  desktop: <DesktopIcon />,
  tablet: <TabletIcon />,
  mobile: <MobileIcon />,
};

export function ViewportSwitcher() {
  const { device, setDevice, focusMode, setFocusMode } = useViewport();
  const current = DEVICES.find((d) => d.value === device)!;

  return (
    <div
      role="group"
      aria-label="Vista previa"
      className="flex shrink-0 items-center gap-0.5 border-l border-line px-3"
    >
      {DEVICES.map((d) => (
        <button
          key={d.value}
          type="button"
          aria-label={d.label}
          title={d.label}
          aria-pressed={device === d.value}
          onClick={() => setDevice(d.value)}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
            device === d.value
              ? "bg-accent/25 text-accent"
              : "text-ink-dim hover:bg-hover hover:text-ink"
          }`}
        >
          {DEVICE_ICONS[d.value]}
        </button>
      ))}
      {/* Qué dispositivo se está editando, con su ancho real. */}
      <span className="ml-1.5 text-xs whitespace-nowrap text-ink-dim" aria-live="polite">
        Editando: <strong className="font-medium text-ink">{current.label} · {current.width} px</strong>
      </span>

      <button
        type="button"
        aria-pressed={focusMode}
        title={focusMode ? "Ver todas las páginas (Mosaico)" : "Enfocar página actual para editar"}
        onClick={() => setFocusMode((f) => !f)}
        className={`ml-3 flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors ${
          focusMode
            ? "bg-accent text-white shadow-xs"
            : "border border-line bg-canvas text-ink-dim hover:bg-hover hover:text-ink"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          {focusMode ? (
            <rect x="2" y="2" width="12" height="12" rx="2" />
          ) : (
            <>
              <rect x="2" y="2" width="5" height="5" rx="1" />
              <rect x="9" y="2" width="5" height="5" rx="1" />
              <rect x="2" y="9" width="5" height="5" rx="1" />
              <rect x="9" y="9" width="5" height="5" rx="1" />
            </>
          )}
        </svg>
        <span>{focusMode ? "Página enfocada" : "Enfocar página"}</span>
      </button>
    </div>
  );
}
