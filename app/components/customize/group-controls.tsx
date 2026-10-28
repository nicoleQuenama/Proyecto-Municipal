"use client";

import { useSite, useSiteDispatch } from "../site/site-context";
import type { CanvasElement } from "../site/types";

const button = "h-8 rounded-md border border-line px-3 text-xs hover:bg-hover";

/** Agrupar los elementos marcados en una tarjeta (o deshacer una): la tarjeta se mueve y se acomoda como una sola pieza. */
export function GroupControls({ componentId, element }: { componentId: string; element: CanvasElement }) {
  const { alsoSelectedIds } = useSite();
  const dispatch = useSiteDispatch();
  const ids = [element.id, ...(alsoSelectedIds ?? [])];
  const isCard = element.id.includes("-tarjeta-");

  if (!isCard && ids.length < 2) {
    return <p className="text-[11px] text-ink-dim">Marca varios elementos (Ctrl + clic, o arrastra un rectángulo) para agruparlos en una tarjeta.</p>;
  }
  return (
    <div className="flex flex-col gap-1">
      {isCard ? (
        <button type="button" onClick={() => dispatch({ type: "elements/ungroup", componentId, elementId: element.id })} className={button}>
          Deshacer la tarjeta (Ctrl+Mayús+G)
        </button>
      ) : (
        <button type="button" onClick={() => dispatch({ type: "elements/group", componentId, elementIds: ids })} className={button}>
          Agrupar {ids.length} elementos en una tarjeta (Ctrl+G)
        </button>
      )}
      <p className="text-[11px] text-ink-dim">En una fila, cuadrícula o carrusel, la tarjeta se acomoda y se desliza entera.</p>
    </div>
  );
}
