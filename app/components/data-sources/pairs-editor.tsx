import { fieldClass } from "./field-class";
import type { QueryParam } from "./types";

interface PairsEditorProps {
  label: string;
  keyPlaceholder: string;
  pairs: QueryParam[];
  onChange: (pairs: QueryParam[]) => void;
}

/** Una lista de pares clave = valor (parámetros de la URL, cabeceras). */
export function PairsEditor({ label, keyPlaceholder, pairs, onChange }: PairsEditorProps) {
  const edit = (index: number, patch: Partial<QueryParam>) =>
    onChange(pairs.map((pair, i) => (i === index ? { ...pair, ...patch } : pair)));

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1 text-[11px] text-ink-dim">{label}</legend>
      {pairs.map((pair, index) => (
        <div key={index} className="flex gap-1">
          <input aria-label={keyPlaceholder} placeholder={keyPlaceholder} value={pair.key} onChange={(e) => edit(index, { key: e.target.value })} className={fieldClass} />
          <input aria-label="Valor" placeholder="valor" value={pair.value} onChange={(e) => edit(index, { value: e.target.value })} className={fieldClass} />
          <button type="button" aria-label="Quitar" onClick={() => onChange(pairs.filter((_, i) => i !== index))} className="px-1 text-ink-dim hover:text-ink">
            ×
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...pairs, { key: "", value: "" }])} className="self-start text-xs text-accent hover:underline">
        + Añadir
      </button>
    </fieldset>
  );
}
