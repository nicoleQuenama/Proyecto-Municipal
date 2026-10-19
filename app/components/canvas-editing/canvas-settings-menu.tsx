"use client";

import { useRef, useState } from "react";
import { useDismiss } from "../ui/use-dismiss";
import { ChevronIcon, SlidersIcon } from "../viewport/icons";
import { CANVAS_TOGGLES, EDIT_SCOPES } from "./canvas-options";
import { useCanvasSettings } from "./settings-context";

const row = "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-hover";

/**
 * Un solo botón para todo lo que ayuda a maquetar: cuadrícula, guías y a qué se aplican los cambios. Mientras los
 * cambios valgan para todos los bloques, el botón lo avisa, para que no pase desapercibido.
 */
export function CanvasSettingsMenu() {
  const { settings, setSettings } = useCanvasSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Ajustes del lienzo"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Cuadrícula, guías y alcance de los cambios"
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 items-center gap-1 rounded-lg px-2 text-ink-dim transition-colors hover:bg-hover hover:text-ink"
      >
        <SlidersIcon />
        {settings.scope === "component" && <span className="text-[11px] font-medium text-accent">Todos</span>}
        <ChevronIcon size={10} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Ajustes del lienzo"
          className="absolute bottom-full left-1/2 z-40 mb-3 w-72 -translate-x-1/2 rounded-lg border border-line bg-panel p-2 text-ink shadow-2xl"
        >
          <p className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-ink-dim uppercase">Ayudas</p>
          {CANVAS_TOGGLES.map(({ key, label, hint }) => (
            <button
              key={key}
              type="button"
              role="switch"
              aria-checked={settings[key]}
              onClick={() => setSettings((current) => ({ ...current, [key]: !current[key] }))}
              className={row}
            >
              <input type="checkbox" readOnly tabIndex={-1} checked={settings[key]} className="mt-0.5 accent-accent" />
              <span className="flex-1">
                {label}
                <span className="block text-[11px] text-ink-dim">{hint}</span>
              </span>
            </button>
          ))}

          <p className="mt-2 px-2 pb-1 text-[11px] font-semibold tracking-wider text-ink-dim uppercase">
            Los cambios valen para
          </p>
          <div role="radiogroup" aria-label="Alcance de los cambios">
            {EDIT_SCOPES.map(({ value, label, hint }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={settings.scope === value}
                onClick={() => setSettings((current) => ({ ...current, scope: value }))}
                className={row}
              >
                <input type="radio" readOnly tabIndex={-1} checked={settings.scope === value} className="mt-0.5 accent-accent" />
                <span className="flex-1">
                  {label}
                  <span className="block text-[11px] text-ink-dim">{hint}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
