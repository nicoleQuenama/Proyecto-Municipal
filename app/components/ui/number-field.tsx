interface NumberFieldProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function NumberField({ label, value, min, max, step, disabled, onChange }: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
      {label}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.valueAsNumber;
          if (!Number.isNaN(next)) onChange(next);
        }}
        className="h-8 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent disabled:opacity-40"
      />
    </label>
  );
}
