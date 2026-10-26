"use client";

import { useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";

/** ¿El foco está en algo donde se escribe? Ahí la barra espaciadora es un espacio. */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName));

/** Desplazarse arrastrando: con la herramienta mano, o con la barra espaciadora pulsada. */
export function usePan(viewport: RefObject<HTMLDivElement | null>) {
  const [hand, setHand] = useState(false);
  const [space, setSpace] = useState(false);
  const [dragging, setDragging] = useState(false);
  const from = useRef<{ x: number; y: number; left: number; top: number } | null>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space" || isTyping(e.target)) return;
      e.preventDefault();
      setSpace(true);
    };
    const up = (e: KeyboardEvent) => e.code === "Space" && setSpace(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const active = hand || space;

  const handlers = {
    // En captura: mientras se desplaza, los elementos del lienzo no reciben el clic.
    onPointerDownCapture: (e: PointerEvent<HTMLDivElement>) => {
      const box = viewport.current;
      if (!active || !box) return;
      e.preventDefault();
      e.stopPropagation();
      from.current = { x: e.clientX, y: e.clientY, left: box.scrollLeft, top: box.scrollTop };
      box.setPointerCapture(e.pointerId);
      setDragging(true);
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      const start = from.current;
      const box = viewport.current;
      if (!start || !box) return;
      box.scrollLeft = start.left - (e.clientX - start.x);
      box.scrollTop = start.top - (e.clientY - start.y);
    },
    onPointerUp: () => {
      from.current = null;
      setDragging(false);
    },
  };

  const cursor = dragging ? "grabbing" : active ? "grab" : undefined;
  return { hand, setHand, cursor, handlers };
}
