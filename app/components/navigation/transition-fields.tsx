"use client";

import { NumberField } from "../ui/number-field";
import {
  MAX_TRANSITION_SECONDS,
  MIN_TRANSITION_SECONDS,
  normalizeTransition,
  TRANSITION_LABELS,
} from "./links";
import type { Transition, TransitionKind } from "./types";

export const KINDS = Object.keys(TRANSITION_LABELS) as TransitionKind[];

const selectClass =
  "h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent [&>option]:bg-panel";

interface TransitionFieldsProps {
  value: Transition;
  onChange: (value: Transition) => void;
  label: string;
}

/** Tipo de animación y cuántos segundos dura. */
export function TransitionFields({ value, onChange, label }: TransitionFieldsProps) {
  return (
    <div className="grid grid-cols-[1fr_5.5rem] items-end gap-2">
      <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
        {label}
        <select
          value={value.kind}
          onChange={(e) =>
            onChange(normalizeTransition({ kind: e.target.value as TransitionKind, seconds: value.seconds || 0.4 }))
          }
          className={selectClass}
        >
          {KINDS.map((kind) => (
            <option key={kind} value={kind}>{TRANSITION_LABELS[kind]}</option>
          ))}
        </select>
      </label>

      <NumberField
        label="Segundos"
        value={value.seconds}
        min={MIN_TRANSITION_SECONDS}
        max={MAX_TRANSITION_SECONDS}
        step={0.1}
        disabled={value.kind === "none"}
        onChange={(seconds) => onChange(normalizeTransition({ ...value, seconds }))}
      />
    </div>
  );
}
