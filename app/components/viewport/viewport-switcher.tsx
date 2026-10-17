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
  const { device, setDevice } = useViewport();

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
    </div>
  );
}
