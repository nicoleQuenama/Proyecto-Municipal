import type { Patch } from "../types";

type PatchKey = Pick<Patch, "path" | "selector" | "kind" | "name" | "device">;

/** El mismo elemento, la misma propiedad y la misma pantalla son un solo cambio: editar otra vez lo reemplaza. */
export const patchId = ({ path, selector, kind, name, device }: PatchKey): string =>
  [path, selector, kind, name, device].join("|");
