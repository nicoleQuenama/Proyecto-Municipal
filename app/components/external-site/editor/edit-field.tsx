"use client";

import type { ReactNode } from "react";
import type { InputKind } from "./quick-edits";

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const BOX = "rounded-md border border-line bg-canvas px-2 text-[13px] outline-none focus:border-accent";
const ALIGNS = [["left", "Izquierda"], ["center", "Centro"], ["right", "Derecha"], ["justify", "Justificado"]];

/** Cada tipo de campo. Uno nuevo es una entrada nueva. */
const INPUTS: Record<InputKind, (p: FieldProps) => ReactNode> = {
  text: ({ label, value, onChange }) => (
    <input aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={`h-8 ${BOX}`} />
  ),
  textarea: ({ label, value, onChange }) => (
    <textarea aria-label={label} rows={3} value={value} onChange={(e) => onChange(e.target.value)} className={`py-1.5 ${BOX}`} />
  ),
  color: ({ label, value, onChange }) => (
    <input aria-label={label} type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-14 cursor-pointer rounded-md border border-line bg-canvas p-0.5" />
  ),
  px: ({ label, value, onChange }) => (
    <input aria-label={label} type="number" min={0} value={value} onChange={(e) => onChange(e.target.value)} className={`h-8 w-24 ${BOX}`} />
  ),
  align: ({ label, value, onChange }) => (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={`h-8 ${BOX}`}>
      {ALIGNS.map(([id, name]) => (
        <option key={id} value={id}>{name}</option>
      ))}
    </select>
  ),
};

export function EditField({ input, changed, ...field }: FieldProps & { input: InputKind; changed: boolean }) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="flex items-center gap-1.5 text-ink-dim">
        {field.label}
        {changed && <span title="Tiene un cambio" className="h-1.5 w-1.5 rounded-full bg-accent" />}
      </span>
      {INPUTS[input](field)}
    </label>
  );
}
