import type { Clip } from "./paste-rules";

/** Lo último que se copió en el lienzo (una o varias secciones); vive mientras la pestaña está abierta y sirve entre páginas. */
let current: Clip[] = [];

export const readClip = (): Clip[] => current;
export const writeClip = (clips: Clip[]) => {
  current = clips;
};
