"use client";

import { createContext, useLayoutEffect, useState, type RefObject } from "react";

/**
 * La vista previa de escritorio ocupa todo el ancho de la ventana y deja el relleno lateral en `--cms-side`;
 * las secciones de borde a borde lo usan para salir de ese relleno y llegar a los bordes de la página.
 */
export const FullBleedContext = createContext(false);

/** El ancho actual de un elemento, que se actualiza al cambiar el tamaño de la ventana. */
export function useWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setWidth(element.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}
