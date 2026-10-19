import type { ReactNode } from "react";

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

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <input
        type="color"
        value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#cccccc"}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full cursor-pointer rounded-md border border-line bg-canvas p-1"
      />
    </Field>
  );
}
