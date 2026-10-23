import { CACHE_STRATEGIES } from "./cache-strategies";
import { fieldClass } from "./field-class";
import type { CacheKind, CacheStrategy } from "./types";

/** Elige cómo se guardan las respuestas; solo «tiempo» pide además los segundos. */
export function CacheSelect({ value, onChange }: { value: CacheStrategy; onChange: (value: CacheStrategy) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-ink-dim" htmlFor="cache-strategy">
        Caché
      </label>
      <select
        id="cache-strategy"
        value={value.kind}
        onChange={(e) => onChange({ ...value, kind: e.target.value as CacheKind })}
        className={fieldClass}
      >
        {(Object.keys(CACHE_STRATEGIES) as CacheKind[]).map((kind) => (
          <option key={kind} value={kind}>
            {CACHE_STRATEGIES[kind].label}
          </option>
        ))}
      </select>
      {value.kind === "ttl" && (
        <input
          type="number"
          min={1}
          aria-label="Segundos"
          value={value.seconds}
          onChange={(e) => onChange({ ...value, seconds: Math.max(1, Number(e.target.value) || 1) })}
          className={fieldClass}
        />
      )}
      <p className="text-xs text-ink-dim">{CACHE_STRATEGIES[value.kind].hint}</p>
    </div>
  );
}
