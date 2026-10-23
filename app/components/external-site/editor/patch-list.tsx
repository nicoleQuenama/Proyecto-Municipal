"use client";

import { PATCH_KINDS } from "../patch-kinds";
import type { Patch } from "../types";

interface PatchListProps {
  patches: Patch[];
  onRemove: (id: string) => void;
  emptyMessage: string;
}

/** Los cambios hechos, con lo que hace cada uno y un botón para deshacerlo. */
export function PatchList({ patches, onRemove, emptyMessage }: PatchListProps) {
  if (patches.length === 0) return <p className="text-xs text-ink-dim">{emptyMessage}</p>;

  return (
    <ul className="flex flex-col gap-1">
      {patches.map((patch) => (
        <li key={patch.id} className="flex items-start gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-hover">
          <span className="min-w-0 flex-1">
            <span className="block truncate">{patch.label}</span>
            <span className="block truncate text-ink-dim">{PATCH_KINDS[patch.kind].summary(patch)}</span>
          </span>
          <button
            type="button"
            aria-label={`Deshacer el cambio en ${patch.label}`}
            onClick={() => onRemove(patch.id)}
            className="shrink-0 rounded px-1.5 text-ink-dim hover:bg-black/30 hover:text-ink"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
