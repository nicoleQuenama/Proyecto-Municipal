import type { ReactNode } from "react";
import { colorInputValue } from "../format/format-options";
import type { FieldKind } from "./step-meta";

type Value = string | number;

interface ValueInputProps {
  label: string;
  value: Value;
  step?: number;
  onChange: (value: Value) => void;
}

const inputClass = "h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent";

/** «12px 30px» → [12, 30]. */
const pairOf = (value: Value): [number, number] => {
  const [x, y] = String(value).split(" ").map((part) => parseFloat(part) || 0);
  return [x ?? 0, y ?? 0];
};

/** Cómo se dibuja cada tipo de valor. Un tipo nuevo es una entrada nueva. */
const INPUTS: { [K in FieldKind]: (props: ValueInputProps) => ReactNode } = {
  number: ({ label, value, step, onChange }) => (
    <input aria-label={label} type="number" step={step ?? 1} value={Number(value)} onChange={(e) => onChange(Number(e.target.value))} className={inputClass} />
  ),

  color: ({ label, value, onChange }) => (
    <input
      aria-label={label}
      type="color"
      value={colorInputValue(String(value))}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-full cursor-pointer rounded-md border border-line bg-canvas p-0.5"
    />
  ),

  angle: ({ label, value, onChange }) => (
    <input aria-label={label} type="number" value={parseFloat(String(value)) || 0} onChange={(e) => onChange(`${e.target.value || 0}deg`)} className={inputClass} />
  ),

  pair: ({ label, value, onChange }) => {
    const [x, y] = pairOf(value);
    return (
      <span className="flex gap-1">
        <input aria-label={`${label} horizontal`} type="number" value={x} onChange={(e) => onChange(`${e.target.value || 0}px ${y}px`)} className={inputClass} />
        <input aria-label={`${label} vertical`} type="number" value={y} onChange={(e) => onChange(`${x}px ${e.target.value || 0}px`)} className={inputClass} />
      </span>
    );
  },

  text: ({ label, value, onChange }) => (
    <input aria-label={label} value={String(value)} onChange={(e) => onChange(e.target.value)} className={inputClass} />
  ),
};

export function ValueInput({ field, ...props }: ValueInputProps & { field: FieldKind }) {
  return <>{INPUTS[field](props)}</>;
}
