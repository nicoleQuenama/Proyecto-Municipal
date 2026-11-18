/** Qué código corrió ya y sobre qué elemento de la página. */
export interface RanFor {
  element: HTMLElement | null;
  key: string;
}

/**
 * En desarrollo React monta cada efecto, lo desmonta y lo vuelve a montar. El código de la página no se deshace al
 * desmontar (añade elementos al DOM), así que correría dos veces y duplicaría lo que dibuja. Si es el mismo código
 * sobre el mismo elemento, ya corrió.
 */
export const alreadyRan = (previous: RanFor | null, next: RanFor): boolean =>
  previous !== null && previous.element === next.element && previous.key === next.key;
