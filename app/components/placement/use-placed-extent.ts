"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

/** El relleno inferior de la página (`py-12`): lo que queda bajo el último elemento. */
const PAGE_PADDING_BOTTOM = 48;

/**
 * Hasta dónde llegan los elementos en posición libre de una página (en px, 0 si no hay). La página no es más
 * baja que eso: así nada colocado abajo queda fuera de ella al publicarla.
 */
export function usePlacedExtent(pageRef: RefObject<HTMLElement | null>): number {
  const [extent, setExtent] = useState(0);

  // Sin dependencias: se mide tras cada dibujo, porque mover un elemento cambia el resultado. No entra en bucle:
  // solo se actualiza el estado cuando la medida cambia.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const bottoms = [...page.querySelectorAll<HTMLElement>("[data-placed]")].map((el) => el.offsetTop + el.offsetHeight);
    const next = bottoms.length > 0 ? Math.max(...bottoms) + PAGE_PADDING_BOTTOM : 0;
    setExtent((current) => (current === next ? current : next));
  });

  return extent;
}
