import type { ReactNode } from "react";
import type { Change } from "./types";

const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function DiffValue({ text, className }: { text: string; className: string }) {
  return (
    <span
      title={text}
      className={`inline-flex max-w-44 items-center gap-1.5 rounded px-1.5 py-0.5 ${className}`}
    >
      {HEX_COLOR.test(text) && (
        <span
          aria-hidden
          className="h-3 w-3 shrink-0 rounded-sm border border-white/30"
          style={{ background: text }}
        />
      )}
      <span className="truncate">{text}</span>
    </span>
  );
}

interface DiffRowProps {
  change: Change;
  /** Contenido antes del nombre, p. ej. una casilla para añadir el cambio. */
  leading?: ReactNode;
}

export function DiffRow({ change, leading }: DiffRowProps) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-md bg-canvas px-3 py-2 text-xs">
      {leading}
      <span className="min-w-0 flex-1 truncate">
        <span className="font-medium">{change.node}</span>
        <span className="text-ink-dim"> · {change.property}</span>
      </span>

      <span className="flex shrink-0 items-center gap-2">
        <DiffValue text={change.before} className="bg-red-500/15 text-red-400 line-through" />
        <span aria-hidden className="text-ink-dim">→</span>
        <DiffValue text={change.after} className="bg-green-500/15 text-green-400" />
      </span>
    </li>
  );
}

/** Cambio en una sola línea corta, para mostrarlo junto a otros sin ocupar una fila entera. */
export function ChangeChip({ change, showNode = false }: { change: Change; showNode?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px]">
      <span className="text-ink-dim">
        {showNode && `${change.node} · `}
        {change.property}
      </span>
      <DiffValue text={change.before} className="bg-red-500/15 text-red-400 line-through" />
      <span aria-hidden className="text-ink-dim">→</span>
      <DiffValue text={change.after} className="bg-green-500/15 text-green-400" />
    </span>
  );
}
