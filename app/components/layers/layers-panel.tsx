"use client";

import type { CanvasElement } from "../site/types";
import { canStep, frontToBack, stepLayer } from "./layer-order";
import { LayerRow } from "./layer-row";
import { useLayerDrag } from "./use-layer-drag";

/** Lo que una capa puede cambiar desde el panel. */
export type LayerPatch = Partial<Pick<CanvasElement, "name" | "hidden" | "locked">>;

interface LayersPanelProps {
  /** Los elementos de atrás hacia delante, como se dibujan. */
  elements: CanvasElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPatch: (id: string, patch: LayerPatch) => void;
  /** Los ids en el nuevo orden, de atrás hacia delante. */
  onReorder: (ids: string[]) => void;
}

/** Las capas: arriba lo que está delante. Ordenar arrastrando o con las flechas; ojo, candado y nombre propios. */
export function LayersPanel({ elements, selectedId, onSelect, onPatch, onReorder }: LayersPanelProps) {
  const ids = elements.map((element) => element.id);
  const drag = useLayerDrag(ids, onReorder);

  if (elements.length === 0) return <p className="text-[11px] text-ink-dim">Todavía no hay elementos.</p>;

  return (
    <div className="flex flex-col gap-1">
      <ul aria-label="Capas (arriba, lo que está delante)" className="flex flex-col gap-px">
        {frontToBack(elements).map((element) => (
          <LayerRow
            key={element.id}
            element={element}
            selected={element.id === selectedId}
            dragging={drag.dragId === element.id}
            dropPlace={drag.over?.id === element.id && drag.dragId !== element.id ? drag.over.place : null}
            canForward={canStep(ids, element.id, "forward")}
            canBackward={canStep(ids, element.id, "backward")}
            dragProps={drag.rowProps(element.id)}
            onSelect={() => onSelect(element.id)}
            onRename={(name) => onPatch(element.id, { name })}
            onToggleHidden={() => onPatch(element.id, { hidden: !element.hidden })}
            onToggleLocked={() => onPatch(element.id, { locked: !element.locked })}
            onStep={(step) => onReorder(stepLayer(ids, element.id, step))}
          />
        ))}
      </ul>
      <p className="text-[10px] text-ink-dim">Arrastra una capa para ordenarla. Un candado la deja fija en el lienzo.</p>
    </div>
  );
}
