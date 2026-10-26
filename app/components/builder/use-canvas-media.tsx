"use client";

import { useRef, useState, type DragEvent, type Dispatch, type RefObject } from "react";
import { newElement } from "../site/component-templates";
import type { CanvasElement } from "../site/types";
import type { BuilderAction } from "./builder-reducer";
import { isMediaKind, patchFromFile } from "./media-patch";

const carriesFiles = (e: DragEvent) => Array.from(e.dataTransfer.types).includes("Files");

/** Imágenes en el lienzo: soltar un archivo sobre una imagen la rellena; sobre el lienzo, agrega una imagen nueva. */
export function useCanvasMedia(dispatch: Dispatch<BuilderAction>, canvasRef: RefObject<HTMLDivElement | null>) {
  const input = useRef<HTMLInputElement>(null);
  const picking = useRef<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Pone el archivo en el elemento `target`, o crea una imagen nueva en `at` si no hay elemento. */
  const place = async (file: File, target: CanvasElement | null, at: { x: number; y: number }) => {
    const kind = target && isMediaKind(target.kind) ? target.kind : "image";
    const result = await patchFromFile(kind, file);
    setError(result.ok ? null : result.error);
    if (!result.ok) return;
    if (target) return dispatch({ type: "update", id: target.id, patch: result.value });
    const element = newElement("image", crypto.randomUUID(), { ...result.value, x: at.x, y: at.y });
    dispatch({ type: "add", element });
  };

  const drop = (target: CanvasElement | null) => ({
    onDragOver: (e: DragEvent) => {
      if (!carriesFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
      setOverId(target?.id ?? "canvas");
    },
    onDragLeave: () => setOverId(null),
    onDrop: (e: DragEvent) => {
      setOverId(null);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      e.preventDefault();
      e.stopPropagation(); // la zona de soltado de toda la ventana no lo vuelve a tomar
      const box = canvasRef.current!.getBoundingClientRect();
      const scale = box.width / canvasRef.current!.offsetWidth || 1;
      void place(file, target && isMediaKind(target.kind) ? target : null, {
        x: (e.clientX - box.left) / scale,
        y: (e.clientY - box.top) / scale,
      });
    },
  });

  /** Un clic en una imagen vacía ya seleccionada abre el selector de archivos. */
  const pick = (element: CanvasElement) => {
    picking.current = element.id;
    input.current?.click();
  };

  const picker = (
    <input
      ref={input}
      type="file"
      accept="image/*"
      hidden
      onChange={(e) => {
        const file = e.target.files?.[0];
        const id = picking.current;
        e.target.value = "";
        if (file && id) void place(file, { id } as CanvasElement, { x: 0, y: 0 });
      }}
    />
  );

  return { drop, pick, picker, overId, error };
}
