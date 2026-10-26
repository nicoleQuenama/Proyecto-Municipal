"use client";

import { useSiteDispatch } from "../site/site-context";
import type { BlockInstance, CanvasElement } from "../site/types";

interface AltControlProps {
  pageId: string;
  block: BlockInstance;
  element: CanvasElement;
}

/** Texto alternativo de una imagen o un video, solo para este bloque (el del componente se pone en el constructor). */
export function AltControl({ pageId, block, element }: AltControlProps) {
  const dispatch = useSiteDispatch();
  if (element.kind !== "image" && element.kind !== "video") return null;

  const value = block.elements?.[element.id]?.alt ?? element.alt ?? "";
  const setAlt = (alt: string) =>
    dispatch({ type: "block/style", pageId, blockId: block.id, elementIds: [element.id], patch: { alt } });

  return (
    <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
      Texto alternativo (alt)
      <input
        value={value}
        placeholder="Describe lo que se ve"
        onChange={(e) => setAlt(e.target.value)}
        className="h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent"
      />
      <span>Lo leen los lectores de pantalla y Google. Déjalo vacío solo si la imagen es decorativa.</span>
    </label>
  );
}
