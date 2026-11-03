"use client";

export interface PaletteOption {
  name: string;
  value: string;
}

/** Selector compacto de la paleta que definió el superadministrador. */
export function PaletteSelect({
  options,
  value,
  onChange,
}: {
  options: PaletteOption[];
  value: string;
  onChange: (color: string) => void;
}) {
  if (options.length === 0) {
    return <p className="text-[10px] leading-tight text-ink-dim">La paleta aún no tiene colores.</p>;
  }

  return (
    <select
      aria-label="Elegir un color de la paleta"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-7 w-full rounded-md border border-line bg-canvas px-1 text-[10px] text-ink outline-none focus:border-accent [&>option]:bg-panel"
    >
      {value !== "" && !options.some((option) => option.value === value) && (
        <option value={value}>Actual · {value}</option>
      )}
      {options.map((option) => (
        <option key={`${option.name}:${option.value}`} value={option.value}>
          {option.name} · {option.value}
        </option>
      ))}
    </select>
  );
}
