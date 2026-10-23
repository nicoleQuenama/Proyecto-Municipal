import { PRESETS, type PresetId } from "./presets";

/** La galería de efectos: tocar uno lo elige y lo reproduce sobre la página para verlo al momento. */
export function PresetGrid({ value, onPick }: { value: PresetId; onPick: (id: PresetId) => void }) {
  return (
    <div role="radiogroup" aria-label="Efecto" className="grid grid-cols-4 gap-1.5">
      {(Object.keys(PRESETS) as PresetId[]).map((id) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={id === value}
          onClick={() => onPick(id)}
          className={`flex h-16 flex-col items-center justify-center gap-1 rounded-lg border px-1 text-center transition-colors ${
            id === value ? "border-accent bg-accent/15 text-accent" : "border-line text-ink hover:bg-hover"
          }`}
        >
          <span aria-hidden className="text-lg leading-none">{PRESETS[id].icon}</span>
          <span className="text-[10px] leading-tight">{PRESETS[id].label}</span>
        </button>
      ))}
    </div>
  );
}
