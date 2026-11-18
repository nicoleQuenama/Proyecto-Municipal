"use client";

import { useState } from "react";
import type { BlockKind } from "../site/code-kind-rules";
import { codeOf } from "../site/code-source";
import { useSite, useSiteDispatch } from "../site/site-context";
import { KIND_HINTS, KIND_LABELS, kindOf, usesOf } from "./block-kind";

interface BlockKindSelectProps {
  pageId: string;
  blockId: string;
}

/** Elige si el código de este bloque es suelto, un componente compartido o una plantilla. */
export function BlockKindSelect({ pageId, blockId }: BlockKindSelectProps) {
  const { pages, components } = useSite();
  const dispatch = useSiteDispatch();
  const [asking, setAsking] = useState<BlockKind | null>(null);
  const [name, setName] = useState("");

  const block = pages.flatMap((p) => p.blocks).find((b) => b.id === blockId);
  if (!block || !codeOf(block, components)) return null;

  const kind = kindOf(block, components);
  const uses = kind === "component" ? usesOf(block.componentId, pages) : 0;

  const choose = (next: BlockKind) => {
    if (next === kind) return setAsking(null);
    // Componente y plantilla se guardan con un nombre; volver a suelto no lo necesita.
    if (next === "loose") return dispatch({ type: "block/set-kind", pageId, blockId, kind: next });
    setName(components.find((c) => c.id === block.componentId)?.name ?? "");
    setAsking(next);
  };

  const confirm = () => {
    if (!asking || !name.trim()) return;
    dispatch({ type: "block/set-kind", pageId, blockId, kind: asking, name });
    setAsking(null);
  };

  return (
    <span className="flex items-center gap-1.5 text-[11px] text-ink-dim">
      <label className="flex items-center gap-1.5" title={KIND_HINTS[kind]}>
        Tipo de bloque
        <select
          aria-label="Tipo de bloque"
          value={asking ?? kind}
          onChange={(e) => choose(e.target.value as BlockKind)}
          className="h-6 rounded border border-line bg-canvas px-1 text-ink [&>option]:bg-panel"
        >
          {(Object.keys(KIND_LABELS) as BlockKind[]).map((value) => (
            <option key={value} value={value}>{KIND_LABELS[value]}</option>
          ))}
        </select>
      </label>

      {asking && (
        <>
          <input
            aria-label="Nombre"
            autoFocus
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirm()}
            placeholder={asking === "component" ? "p. ej. Header" : "p. ej. Tarjetas"}
            className="h-6 w-32 rounded border border-line bg-canvas px-1.5 text-ink outline-none focus:border-accent"
          />
          <button type="button" onClick={confirm} disabled={!name.trim()} className="h-6 rounded bg-accent/25 px-2 text-accent disabled:opacity-40 cursor-pointer">
            Guardar
          </button>
        </>
      )}

      {kind === "component" && !asking && <span>Se usa en {uses} {uses === 1 ? "lugar" : "lugares"}</span>}
    </span>
  );
}
