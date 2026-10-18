import type { CSSProperties, ReactNode } from "react";
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
      className={`${buttonBase} ${active ? "bg-accent/25 text-accent" : "text-ink hover:bg-hover"}`}
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
      className={`${buttonBase} ${danger ? "text-red-400 hover:bg-red-500/15" : "text-ink hover:bg-hover"}`}
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
}

/** Un selector de color con su etiqueta. */
export function ColorField({ label, value, disabled, onChange }: ColorFieldProps) {
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
