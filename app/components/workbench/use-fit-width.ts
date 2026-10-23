"use client";

import { useLayoutEffect, useRef, useState } from "react";

/** La escala (máx. 1) que hace caber un diseño de `designWidth` px en el ancho disponible del contenedor. */
export function useFitWidth(designWidth: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(Math.min(1, (el.clientWidth - 16) / designWidth) || 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [designWidth]);

  return { ref, scale };
}
