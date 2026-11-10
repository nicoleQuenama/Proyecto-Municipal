import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { PaletteOption } from "../section-colors/palette-select";
import { useDismiss } from "../ui/use-dismiss";
import { colorInputValue } from "./format-options";

const buttonBase =
  "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-[13px] transition-colors disabled:opacity-40";

interface ToggleButtonProps {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  style?: CSSProperties;
}

/** Un botón que se enciende y se apaga (negrita, lista…). */
export function ToggleButton({ label, active, disabled, onClick, children, style }: ToggleButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`${buttonBase} ${active ? "bg-accent/25 text-accent" : "text-ink hover:bg-hover"} cursor-pointer`}
      style={style}
    >
      {children}
    </button>
  );
}

/** Un botón de una sola acción (mover, ocultar…). */
export function ActionButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`${buttonBase} ${danger ? "text-red-400 hover:bg-red-500/15" : "text-ink hover:bg-hover"} cursor-pointer`}
    >
      {children}
    </button>
  );
}

interface ColorFieldProps {
  label: string;
  value: string | undefined;
  disabled?: boolean;
  onChange: (color: string) => void;
  /** Restricción a paleta del manual de marca para diseñadores */
  restrictToPalette?: boolean;
  palette?: PaletteOption[];
}

/** Un selector de color con su etiqueta (con soporte de paleta corporativa para diseñadores). */
export function ColorField({
  label,
  value,
  disabled,
  onChange,
  restrictToPalette = false,
  palette = [],
}: ColorFieldProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useDismiss(containerRef, open, () => setOpen(false));

  if (restrictToPalette) {
    return (
      <div ref={containerRef} className="relative flex items-center">
        <button
          type="button"
          disabled={disabled}
          aria-label={label}
          title={`${label} (Manual de marca)`}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-2 text-xs text-ink-dim hover:text-ink disabled:opacity-40"
        >
          <span className="h-7 w-9 rounded border border-line bg-canvas p-0.5 shadow-xs flex items-center justify-center">
            <span
              className="h-full w-full rounded-sm border border-black/10"
              style={{ background: colorInputValue(value) }}
            />
          </span>
          <span className="truncate">{label}</span>
        </button>

        {open && (
          <div
            role="dialog"
            aria-label={`Paleta corporativa para ${label}`}
            className="absolute top-full left-0 z-50 mt-1 min-w-44 rounded-xl border border-line bg-panel p-2 shadow-2xl backdrop-blur-md"
          >
            <div className="mb-1.5 flex items-center justify-between border-b border-line/60 pb-1">
              <span className="text-[10px] font-semibold tracking-wider text-ink-dim uppercase">
                Manual de marca
              </span>
              <span className="text-[9px] text-accent font-medium">Oficial</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 pt-0.5">
              {palette.map((color) => {
                const currentVal = colorInputValue(value).toLowerCase();
                const isSelected = currentVal === color.value.toLowerCase();
                return (
                  <button
                    key={`${color.name}-${color.value}`}
                    type="button"
                    title={`${color.name}: ${color.value}`}
                    onClick={() => {
                      onChange(color.value);
                      setOpen(false);
                    }}
                    className={`group relative flex h-7 w-7 items-center justify-center rounded-md border transition-transform hover:scale-110 ${
                      isSelected ? "border-accent ring-2 ring-accent/50" : "border-line/80"
                    }`}
                    style={{ background: color.value }}
                  >
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-white shadow-xs drop-shadow-sm" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <label className="flex items-center gap-2 text-xs text-ink-dim">
      <input
        type="color"
        aria-label={label}
        disabled={disabled}
        value={colorInputValue(value)}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-9 cursor-pointer rounded border border-line bg-canvas p-0.5 disabled:opacity-40"
      />
      {label}
    </label>
  );
}

/** Un grupo de controles del menú, separado del anterior por una línea. */
export function MenuGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-line p-2 first:border-t-0">
      {title && <p className="px-1 text-[10px] font-semibold tracking-wider text-ink-dim uppercase">{title}</p>}
      {children}
    </div>
  );
}
