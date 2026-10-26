"use client";

import { useState, type DragEvent } from "react";
import { dropLayer, type LayerPlace } from "./layer-order";

interface Over {
  id: string;
  place: LayerPlace;
}

/** Arrastrar una capa del panel para soltarla encima o debajo de otra. `ids` va de atrás hacia delante. */
export function useLayerDrag(ids: readonly string[], onReorder: (ids: string[]) => void) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<Over | null>(null);

  const end = () => {
    setDragId(null);
    setOver(null);
  };

  const rowProps = (id: string) => ({
    draggable: true,
    onDragStart: (e: DragEvent) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", id);
      setDragId(id);
    },
    onDragOver: (e: DragEvent<HTMLElement>) => {
      if (!dragId) return;
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      setOver({ id, place: e.clientY < rect.top + rect.height / 2 ? "above" : "below" });
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      if (dragId && over) onReorder(dropLayer(ids, dragId, over.id, over.place));
      end();
    },
    onDragEnd: end,
  });

  return { dragId, over, rowProps };
}
