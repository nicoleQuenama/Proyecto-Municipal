import { elementLabel } from "../navigation/links";
import { SECTION_KEY, type CanvasElement } from "../site/types";

interface TargetPickerProps {
  elements: CanvasElement[];
  keys: string[];
  onChange: (keys: string[]) => void;
}

/** Qué se anima: la sección entera o las piezas que se marquen (todas juntas, en cascada si se quiere). */
export function TargetPicker({ elements, keys, onChange }: TargetPickerProps) {
  const options = [{ key: SECTION_KEY, label: "Toda la sección" }, ...elements.map((e) => ({ key: e.id, label: elementLabel(e) }))];
  const toggle = (key: string) => {
    const next = keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key];
    if (next.length > 0) onChange(next);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px] text-ink-dim">
        ¿Qué se anima?
        <button type="button" onClick={() => onChange(elements.map((e) => e.id))} className="text-accent hover:underline">
          Todas las piezas
        </button>
      </div>
      <ul className="flex max-h-24 flex-wrap gap-1 overflow-y-auto">
        {options.map((option) => (
          <li key={option.key}>
            <button
              type="button"
              aria-pressed={keys.includes(option.key)}
              onClick={() => toggle(option.key)}
              className={`rounded-full border px-2.5 py-1 text-[11px] ${
                keys.includes(option.key) ? "border-accent bg-accent/15 text-accent" : "border-line text-ink hover:bg-hover"
              }`}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
