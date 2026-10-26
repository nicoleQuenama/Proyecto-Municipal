import type { ReactNode } from "react";
import { ColorInput } from "../ui/color-input";

/** Estilo común de los campos de texto y selectores del panel. */
export const inputClass =
  "h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent [&>option]:bg-panel";

export const actionButton = "h-8 rounded-md border border-line px-2 text-xs hover:bg-hover";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
      {label}
      {children}
    </label>
  );
}

/** Un color con su campo de texto (ver `ui/color-input`). */
export function ColorField({ label, value, onChange, gradient }: { label: string; value: string; onChange: (v: string) => void; gradient?: boolean }) {
  return (
    <Field label={label}>
      <ColorInput label={label} value={value} onChange={onChange} gradient={gradient} />
    </Field>
  );
}
