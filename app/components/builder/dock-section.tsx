"use client";

import type { Dispatch } from "react";
import { elementLabel } from "../navigation/links";
import type { CanvasElement, DockAlign } from "../site/types";
import type { BuilderAction } from "./builder-reducer";
import { actionButton } from "./panel-fields";

const ALIGNS: DockAlign[] = ["start", "center", "end"];

const ALIGN_LABELS: Record<DockAlign, string> = { start: "inicio", center: "centro", end: "final" };

interface DockSectionProps {
  element: CanvasElement;
  /** El contenedor donde está acoplado, si lo está. */
  parent: CanvasElement | undefined;
  dispatch: Dispatch<BuilderAction>;
}

/** Cómo va un elemento acoplado dentro de su contenedor: ajustado a él, o en una de las 3×3 casillas. */
export function DockSection({ element, parent, dispatch }: DockSectionProps) {
  if (!parent) {
    return (
      <p className="border-t border-line pt-3 text-[11px] leading-snug text-ink-dim">
        Suelta este elemento sobre un rectángulo o una elipse para acoplarlo: lo sigue al moverlo y encaja en una casilla
        si queda cerca (Alt al soltar lo deja libre).
      </p>
    );
  }

  const dockTo = (slot: { h: DockAlign; v: DockAlign }) =>
    dispatch({ type: "dock", id: element.id, parentId: parent.id, anchor: { slot } });

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3">
      <span className="text-[11px] text-ink-dim">
        Acoplado en «{elementLabel(parent)}»{element.slot || element.fitToParent ? "" : " · posición libre"}
      </span>

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={element.fitToParent === true}
          onChange={(e) => dispatch({ type: "update", id: element.id, patch: { fitToParent: e.target.checked } })}
          className="h-3.5 w-3.5 accent-accent"
        />
        Ajustar al contenedor (se adapta si cambia de tamaño)
      </label>

      <div role="radiogroup" aria-label="Casilla dentro del contenedor" className="grid w-24 grid-cols-3 gap-1">
        {ALIGNS.flatMap((v) =>
          ALIGNS.map((h) => {
            const current = element.slot?.h === h && element.slot?.v === v;
            return (
              <button
                key={`${h}-${v}`}
                type="button"
                role="radio"
                aria-checked={current}
                aria-label={`Vertical ${ALIGN_LABELS[v]}, horizontal ${ALIGN_LABELS[h]}`}
                onClick={() => dockTo({ h, v })}
                className={`h-7 rounded border ${current ? "border-accent bg-accent" : "border-line hover:bg-hover"}`}
              />
            );
          }),
        )}
      </div>

      <button type="button" className={actionButton} onClick={() => dispatch({ type: "dock", id: element.id, parentId: null })}>
        Soltar del contenedor
      </button>
    </div>
  );
}
