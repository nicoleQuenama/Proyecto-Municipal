"use client";

import { useState, type ReactNode } from "react";
import type { FieldKind } from "./field-kinds";
import type { CellValue } from "./types";

export interface DataFieldProps {
  label: string;
  value: CellValue | null;
  /** Valores que el campo sugiere (las rutas de las páginas, los medios del proyecto). */
  suggestions: string[];
  onChange: (value: CellValue) => void;
}

const inputClass = "h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent";

/** Un texto que se guarda al terminar de escribir (Enter o salir del campo), no en cada letra. */
function TextInput({ label, value, suggestions, onChange }: DataFieldProps) {
  const [draft, setDraft] = useState(String(value ?? ""));
  const list = `sugerencias-${label.replace(/\s+/g, "-")}`;
  const commit = () => draft !== value && onChange(draft);

  return (
    <>
      <input
        aria-label={label}
        list={suggestions.length > 0 ? list : undefined}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        className={inputClass}
      />
      {suggestions.length > 0 && <datalist id={list}>{suggestions.map((s) => <option key={s} value={s} />)}</datalist>}
    </>
  );
}

function NumberInput({ label, value, onChange }: DataFieldProps) {
  return (
    <input
      aria-label={label}
      type="number"
      value={Number(value)}
      onChange={(e) => e.target.value !== "" && onChange(Number(e.target.value))}
      className={inputClass}
    />
  );
}

function Switch({ label, value, onChange }: DataFieldProps) {
  return (
    <span className="flex h-8 items-center gap-2 text-xs text-ink-dim">
      <input aria-label={label} type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
      {value === true ? "Sí" : "No"}
    </span>
  );
}

const Calculated = () => (
  <span className="flex h-8 items-center text-[11px] italic text-ink-dim">Se calcula en el código: edítalo ahí.</span>
);

/** Cómo se edita cada tipo de campo. Un tipo nuevo es una entrada nueva. */
const VIEWS: Record<FieldKind | "readonly", (props: DataFieldProps) => ReactNode> = {
  text: TextInput,
  link: TextInput,
  media: TextInput,
  number: NumberInput,
  boolean: Switch,
  readonly: Calculated,
};

export const DataField = ({ kind, ...props }: DataFieldProps & { kind: FieldKind | "readonly" }) => VIEWS[kind](props);
