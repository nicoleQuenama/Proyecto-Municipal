"use client";

import { useState, type DragEvent } from "react";
import { DRAG_TYPE, type DataRef } from "./types";

const carriesData = (event: DragEvent) => event.dataTransfer.types.includes(DRAG_TYPE);

function readPayload(event: DragEvent): DataRef | null {
  try {
    return JSON.parse(event.dataTransfer.getData(DRAG_TYPE));
  } catch {
    return null;
  }
}

/** Convierte algo en destino de claves de una API (de cualquier tipo). Devuelve los eventos y si hay una clave encima. */
export function useDataDrop(onDrop: (ref: DataRef) => void, enabled = true) {
  const [over, setOver] = useState(false);

  return {
    over,
    handlers: enabled
      ? {
          onDragOver: (event: DragEvent) => {
            if (!carriesData(event)) return;
            event.preventDefault();
            event.stopPropagation();
            setOver(true);
          },
          onDragLeave: () => setOver(false),
          onDrop: (event: DragEvent) => {
            if (!carriesData(event)) return;
            event.preventDefault();
            event.stopPropagation();
            setOver(false);
            const payload = readPayload(event);
            if (payload) onDrop({ sourceId: payload.sourceId, path: payload.path });
          },
        }
      : {},
  };
}
