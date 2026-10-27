"use client";

import { useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useNavigation } from "../navigation/navigation-context";
import { useViewport } from "../viewport/viewport-context";
import { GradientLayer } from "./gradient-layer";
import type { GradientTarget } from "./types";

/** Lo que se pulsa con la herramienta, de lo más pequeño a lo más grande: un elemento, su sección o la página. */
function targetAt(e: { target: EventTarget | null; altKey: boolean }): GradientTarget | null {
  const node = e.target as Element;
  const pageId = node.closest<HTMLElement>("[data-page-id]")?.dataset.pageId;
  if (!pageId) return null;
  const blockId = node.closest<HTMLElement>("[data-block-id]")?.dataset.blockId;
  if (!blockId) return { kind: "page", pageId };
  const elementId = node.closest<HTMLElement>("[data-el]")?.dataset.el;
  // Con Alt se elige la sección entera aunque se pulse sobre un elemento.
  return elementId && !e.altKey ? { kind: "element", pageId, blockId, elementId } : { kind: "block", pageId, blockId };
}

/**
 * La herramienta «Degradado»: con ella elegida, un clic sobre un elemento, una sección o el fondo de la página abre
 * el editor flotante de degradado sobre eso. Vuelve a la herramienta Mover al elegir.
 */
export function useGradientTool(): { onPointerDownCapture: (e: ReactPointerEvent<HTMLElement>) => void; layer: ReactNode } {
  const { tool, setTool } = useViewport();
  const { mode } = useNavigation();
  const [target, setTarget] = useState<GradientTarget | null>(null);

  const onPointerDownCapture = (e: ReactPointerEvent<HTMLElement>) => {
    if (mode !== "edit" || tool !== "gradient" || e.button !== 0) return;
    if ((e.target as Element).closest("[data-gradient-ui]")) return;
    const next = targetAt(e);
    if (!next) return;
    e.preventDefault();
    e.stopPropagation();
    setTarget(next);
    setTool("select");
  };

  return { onPointerDownCapture, layer: target && <GradientLayer key={JSON.stringify(target)} target={target} onClose={() => setTarget(null)} /> };
}
