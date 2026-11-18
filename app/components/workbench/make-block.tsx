"use client";

import { useState } from "react";
import type { BlockKind } from "../site/code-kind-rules";
import { KIND_HINTS, KIND_LABELS } from "./block-kind";

type MadeKind = Exclude<BlockKind, "loose">;
const MADE_KINDS: MadeKind[] = ["component", "template"];

interface MakeBlockProps {
  initialName: string;
  /** Devuelve el motivo si no se pudo crear. */
  onCreate: (kind: MadeKind, name: string) => string | null;
}

/**
 * La opción que se superpone al seleccionar código, junto a «Convertir en función»: lo pasa a un bloque nuevo
 * de la página, como componente (compartido) o como plantilla (molde de copias).
 */
export function MakeBlock({ initialName, onCreate }: MakeBlockProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  const create = (kind: MadeKind) => {
    if (!name.trim()) return setError("Ponle un nombre.");
    const problem = onCreate(kind, name.trim());
    if (problem) setError(problem);
  };

  return (
    <div className="rounded-lg border border-line bg-panel p-1.5 text-xs text-ink shadow-2xl">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left hover:bg-hover cursor-pointer"
        >
          <span aria-hidden className="text-sm text-accent">▣</span>
          Convertir en componente o plantilla…
        </button>
      ) : (
        <div className="flex flex-col gap-1.5 p-1">
          <input
            autoFocus
            aria-label="Nombre del bloque"
            aria-invalid={error !== null}
            placeholder="Nombre, p. ej. Header"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            className="h-8 rounded-md border border-line bg-canvas px-2 text-xs outline-none focus:border-accent"
          />
          {MADE_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => create(kind)}
              className="rounded-md bg-hover px-2 py-1.5 text-left hover:bg-accent hover:text-white cursor-pointer"
            >
              <span className="block font-medium">{KIND_LABELS[kind]}</span>
              <span className="block text-[11px] opacity-80">{KIND_HINTS[kind]}</span>
            </button>
          ))}
          {error && <p role="alert" className="text-[11px] text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
