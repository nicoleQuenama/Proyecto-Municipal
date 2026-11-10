import { useRef, useState, type ComponentProps, type ReactNode } from "react";
import type { PaletteOption } from "../section-colors/palette-select";
import { useDismiss } from "../ui/use-dismiss";

const BASE =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs text-ink transition-colors hover:bg-hover";
const ACTIVE = "bg-accent/25 text-accent hover:bg-accent/30";

export const fieldClass =
  "h-7 shrink-0 rounded-md border border-transparent bg-transparent px-2 text-xs text-ink outline-none hover:border-line focus:border-accent [&>option]:bg-panel";

interface ToolbarButtonProps extends ComponentProps<"button"> {
  label: string;
  active?: boolean;
}

export function ToolbarButton({
  label,
  active,
  className = "",
  ...props
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`${BASE} ${active ? ACTIVE : ""} ${className} cursor-pointer`}
      {...props}
    />
  );
}

interface ColorButtonProps {
  label: string;
  value: string;
  active?: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
  /** Si está restringido por manual de marca (diseñadores), solo permite elegir de la paleta corporativa */
  restrictToPalette?: boolean;
  palette?: PaletteOption[];
}

export function ColorButton({
  label,
  value,
  active,
  onChange,
  children,
  restrictToPalette = false,
  palette = [],
}: ColorButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useDismiss(containerRef, open, () => setOpen(false));

  if (restrictToPalette) {
    return (
      <div ref={containerRef} className="relative">
        <button
          type="button"
          aria-label={label}
          title={`${label} (Manual de marca)`}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className={`${BASE} ${active ? ACTIVE : ""}`}
        >
          <span className="flex flex-col items-center leading-none pointer-events-none">
            {children}
            <span className="mt-0.5 h-[3px] w-4 rounded-sm border border-black/10" style={{ background: value }} />
          </span>
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
                const isSelected = value.toLowerCase() === color.value.toLowerCase();
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
    <label
      title={label}
      className={`${BASE} relative cursor-pointer ${active ? ACTIVE : ""}`}
    >
      <span className="flex flex-col items-center leading-none">
        {children}
        <span className="mt-0.5 h-[3px] w-4 rounded-sm border border-black/10" style={{ background: value }} />
      </span>
      <input
        type="color"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  );
}

export function Separator() {
  return <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-line" />;
}
