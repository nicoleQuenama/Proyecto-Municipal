"use client";

import { useEffect, useState } from "react";
import { useMedia } from "./media-context";

/** Un arrastre nos interesa solo si trae archivos o un enlace (no texto suelto). */
const carriesMedia = (e: DragEvent) =>
  e.dataTransfer?.types.some((type) => type === "Files" || type === "text/uri-list") ?? false;

/** Zona de soltado sobre toda la ventana, con un aviso visual mientras se arrastra. */
export function MediaDropZone() {
  const { addFromDrop } = useMedia();
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (!carriesMedia(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      setDragging(true);
    };
    const onDragLeave = (e: DragEvent) => {
      if (!e.relatedTarget) setDragging(false); // salió de la ventana
    };
    const onDrop = (e: DragEvent) => {
      if (!carriesMedia(e) || !e.dataTransfer) return;
      e.preventDefault();
      setDragging(false);
      addFromDrop(e.dataTransfer);
    };

    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [addFromDrop]);

  if (!dragging) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-3 z-40 flex items-center justify-center rounded-xl border-2 border-dashed border-accent bg-accent/10 text-sm font-medium text-accent"
    >
      Suelta imágenes o enlaces para insertarlos
    </div>
  );
}
