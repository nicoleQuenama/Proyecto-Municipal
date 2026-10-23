"use client";

import { useState } from "react";

/** Muestra una lista por tramos: así una lista de cientos de elementos no abruma ni se vuelve lenta. */
export function usePaged<T>(items: T[], size = 10) {
  const [shown, setShown] = useState(size);
  return {
    visible: items.slice(0, shown),
    remaining: Math.max(0, items.length - shown),
    showMore: () => setShown((count) => count + size),
  };
}
