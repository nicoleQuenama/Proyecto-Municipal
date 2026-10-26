"use client";

import { useState, type DragEvent } from "react";

const carriesFiles = (e: DragEvent) => Array.from(e.dataTransfer.types).includes("Files");

/** Soltar un archivo sobre un elemento: `over` dice si hay uno encima; `handlers` se esparcen en el elemento. */
export function useFileDrop(onFile: (file: File) => void, enabled = true) {
  const [over, setOver] = useState(false);

  const handlers = {
    onDragOver: (e: DragEvent) => {
      if (!enabled || !carriesFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
      setOver(true);
    },
    onDragLeave: () => setOver(false),
    onDrop: (e: DragEvent) => {
      setOver(false);
      const file = e.dataTransfer.files[0];
      if (!enabled || !file) return;
      e.preventDefault();
      e.stopPropagation(); // la zona de soltado de toda la ventana no lo vuelve a tomar
      onFile(file);
    },
  };
  return { over, handlers };
}
