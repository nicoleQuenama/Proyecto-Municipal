import { formatCombo } from "./shortcut";

export function Kbd({ combo }: { combo: string | null }) {
  if (!combo) return null;

  return (
    <span className="flex items-center gap-1">
      {formatCombo(combo).map((part) => (
        <kbd
          key={part}
          className="min-w-5 rounded border border-line bg-canvas px-1.5 py-0.5 text-center font-sans text-[11px] text-ink-dim"
        >
          {part}
        </kbd>
      ))}
    </span>
  );
}
