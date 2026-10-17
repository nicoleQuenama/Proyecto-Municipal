import { Badge } from "../ui/badge";
import type { Conflict } from "./types";

interface ConflictCardProps {
  conflict: Conflict;
  intoBranch: string;
  fromBranch: string;
  disabled: boolean;
  onResolve: (resolution: "into" | "from") => void;
}

export function ConflictCard({
  conflict,
  intoBranch,
  fromBranch,
  disabled,
  onResolve,
}: ConflictCardProps) {
  const options = [
    { value: "into", branch: intoBranch, result: conflict.into },
    { value: "from", branch: fromBranch, result: conflict.from },
  ] as const;

  return (
    <li className="rounded-lg border border-line bg-canvas p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs">
          <span className="font-medium">{conflict.node}</span>
          <span className="text-ink-dim"> · {conflict.property} (original: {conflict.base})</span>
        </p>
        {conflict.resolution ? (
          <Badge tone="success">Resuelto</Badge>
        ) : (
          <Badge tone="danger">Sin resolver</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            aria-pressed={conflict.resolution === option.value}
            onClick={() => onResolve(option.value)}
            className={`flex flex-col items-start rounded-md border px-3 py-2 text-left text-xs transition-colors disabled:opacity-50 ${
              conflict.resolution === option.value
                ? "border-accent bg-accent/15"
                : "border-line hover:bg-hover"
            }`}
          >
            <span className="max-w-full truncate text-ink-dim">Mantener «{option.branch}»</span>
            <span className="text-[13px] font-medium">{option.result}</span>
          </button>
        ))}
      </div>
    </li>
  );
}
