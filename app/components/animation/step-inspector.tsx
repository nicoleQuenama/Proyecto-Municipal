import { EASINGS } from "./presets";
import { STEP_META } from "./step-meta";
import type { AnimationStep } from "./types";
import { ValueInput } from "./value-input";

interface StepInspectorProps {
  step: AnimationStep;
  onChange: (patch: Partial<AnimationStep>) => void;
  onRemove: () => void;
}

const fieldClass = "h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent [&>option]:bg-panel";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-[11px] text-ink-dim">
      {label}
      {children}
    </label>
  );
}

/** Los datos del paso elegido: de qué valor a cuál, cuándo empieza, cuánto dura y cómo acelera. */
export function StepInspector({ step, onChange, onRemove }: StepInspectorProps) {
  const meta = STEP_META[step.prop];
  const number = (key: "at" | "duration", min: number) => (
    <input
      type="number"
      min={min}
      step={50}
      value={step[key]}
      onChange={(e) => onChange({ [key]: Math.max(min, Number(e.target.value)) })}
      className={fieldClass}
    />
  );

  return (
    <div className="grid grid-cols-2 gap-2 border-t border-line p-3 sm:grid-cols-3">
      <p className="col-span-full text-xs font-medium">{meta.label}</p>
      <Field label="Desde">
        <ValueInput field={meta.field} label="Desde" value={step.from} step={meta.step} onChange={(from) => onChange({ from })} />
      </Field>
      <Field label="Hasta">
        <ValueInput field={meta.field} label="Hasta" value={step.to} step={meta.step} onChange={(to) => onChange({ to })} />
      </Field>
      <Field label="Empieza (ms)">{number("at", 0)}</Field>
      <Field label="Dura (ms)">{number("duration", 1)}</Field>
      <Field label="Movimiento">
        <select value={step.easing ?? EASINGS[0].value} onChange={(e) => onChange({ easing: e.target.value })} className={fieldClass}>
          {EASINGS.map((easing) => (
            <option key={easing.value} value={easing.value}>{easing.label}</option>
          ))}
        </select>
      </Field>
      <button type="button" onClick={onRemove} className="self-end h-8 rounded-md px-3 text-xs text-red-400 hover:bg-hover">
        Quitar paso
      </button>
    </div>
  );
}
