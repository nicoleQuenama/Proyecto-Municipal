"use client";

import { useSite, useSiteDispatch } from "../site/site-context";
import type { BlockInstance, CanvasElement } from "../site/types";
import { BOUND_FIELDS, fieldOf, fieldsFor } from "./bound-fields";
import type { BoundField, DataRef } from "./types";

export const field =
  "h-8 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent [&>option]:bg-panel";
export const card = "flex flex-col gap-2 rounded-lg border border-emerald-600/40 bg-emerald-600/10 p-3 text-xs";

interface BindingControlsProps {
  pageId: string;
  block: BlockInstance;
  element: CanvasElement;
}

/** El dato enlazado a un elemento: de dónde viene y qué parte del elemento llena (texto, color, ancho de barra…). */
export function BindingControls({ pageId, block, element }: BindingControlsProps) {
  const dispatch = useSiteDispatch();
  const { sources } = useSite();
  const ref = block.bindings?.[element.id];
  if (!ref) return null;

  const current = fieldOf(ref, element.kind);
  const bind = (next: DataRef | null) =>
    dispatch({ type: "binding/set", pageId, blockId: block.id, elementId: element.id, ref: next });

  return (
    <section className={card}>
      <p className="font-medium text-emerald-400">Dato de una API</p>
      <p className="truncate text-ink-dim" title={ref.path}>
        {sources.find((s) => s.id === ref.sourceId)?.name ?? "Fuente"} · {ref.path || "toda la respuesta"}
      </p>
      <label className="flex flex-col gap-1 text-ink-dim">
        Este dato llena el…
        <select
          aria-label="Qué llena el dato"
          value={current}
          onChange={(e) => bind({ ...ref, as: e.target.value as BoundField })}
          className={field}
        >
          {fieldsFor(element.kind).map((id) => (
            <option key={id} value={id}>
              {BOUND_FIELDS[id].label}
            </option>
          ))}
        </select>
      </label>
      {BOUND_FIELDS[current].ranged && (
        <label className="flex flex-col gap-1 text-ink-dim">
          Valor con la barra llena
          <input
            type="number"
            min={1}
            aria-label="Valor máximo"
            value={ref.max ?? 100}
            onChange={(e) => bind({ ...ref, max: Math.max(1, Number(e.target.value)) })}
            className={field}
          />
        </label>
      )}
      <button type="button" onClick={() => bind(null)} className="h-8 self-start rounded-md px-2 text-ink-dim hover:bg-hover hover:text-ink">
        Soltar el dato
      </button>
    </section>
  );
}
