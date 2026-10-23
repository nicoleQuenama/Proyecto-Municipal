import { describeProps, type Effect } from "./simple-effects";

interface EffectRowProps {
  label: string;
  effect: Effect;
  onChange: (change: { at?: number; duration?: number }) => void;
  onPlay: () => void;
  onRemove: () => void;
}

const seconds = (ms: number) => (ms / 1000).toFixed(1);

function Slider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (ms: number) => void }) {
  return (
    <label className="flex flex-col gap-0.5 text-[11px] text-ink-dim">
      <span className="flex justify-between">
        {label} <b className="text-ink tabular-nums">{seconds(value)} s</b>
      </span>
      <input type="range" min={min} max={max} step={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className="accent-accent" />
    </label>
  );
}

/** Un efecto en lenguaje llano: a quién le pasa, qué cambia, cuándo empieza y cuánto dura. */
export function EffectRow({ label, effect, onChange, onPlay, onRemove }: EffectRowProps) {
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-line p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{label}</p>
          <p className="text-xs text-ink-dim">Cambia: {describeProps(effect.props)}</p>
        </div>
        <button type="button" onClick={onPlay} className="h-8 rounded-md bg-accent px-3 text-xs text-white hover:opacity-90">
          ▶ Ver
        </button>
        <button type="button" aria-label="Quitar este efecto" onClick={onRemove} className="h-8 rounded-md px-2 text-xs text-red-400 hover:bg-hover">
          Quitar
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Slider label="Empieza a los" value={effect.at} min={0} max={10000} onChange={(at) => onChange({ at })} />
        <Slider label="Dura" value={effect.duration} min={100} max={5000} onChange={(duration) => onChange({ duration })} />
      </div>
    </li>
  );
}
