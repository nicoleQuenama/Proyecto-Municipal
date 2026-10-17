import type { AttributedChange, Change, Commit } from "./types";

/**
 * Valores del diseño necesarios para dibujar la página, indexados por "Elemento|Propiedad"
 * (p. ej. "Titular|Tamaño" → "48px"). Lo que no está definido usa DEFAULT_MODEL.
 */
export type PreviewModel = Record<string, string>;

const keyOf = (node: string, property: string) => `${node}|${property}`;

/** El diseño de partida: lo que se ve antes de cualquier cambio. */
export const DEFAULT_MODEL: PreviewModel = {
  "Titular|Texto": "Portal Municipal",
  "Titular|Tamaño": "48px",
  "Titular|Color": "#171717",
  "Titular|Negrita": "Sí",
  "Titular|Cursiva": "No",
  "Titular|Subrayado": "No",
  "Titular|Tachado": "No",
  "Titular|Resaltado": "Ninguno",
  "Titular|Alineación": "izquierda",
  "Hero|Fondo": "Blanco",
  "Hero · Botón|Texto": "—",
  "Pie de página|Relleno": "16px",
};

export const valueOf = (model: PreviewModel, node: string, property: string): string =>
  model[keyOf(node, property)] ?? DEFAULT_MODEL[keyOf(node, property)] ?? "—";

/** Aplica el valor «antes» o «después» de cada cambio sobre un modelo. */
export function applyChanges(
  model: PreviewModel,
  changes: Change[],
  side: "before" | "after",
): PreviewModel {
  const next = { ...model };
  for (const change of changes) next[keyOf(change.node, change.property)] = change[side];
  return next;
}

/** El diseño después de aplicar las primeras `count` versiones (de la más antigua a la más reciente). */
export function modelAfter(oldestFirst: Commit[], count: number): PreviewModel {
  return oldestFirst
    .slice(0, count)
    .reduce((model, commit) => applyChanges(model, commit.changes, "after"), DEFAULT_MODEL);
}

/** Elementos de la página que se dibujan como zonas; el resto (imágenes, videos) se añaden al final. */
const REGION_ORDER = ["Titular", "Hero", "Hero · Botón", "Pie de página"];

export interface NodeChanges {
  node: string;
  changes: AttributedChange[];
  authors: string[];
  /** Fecha y hora (ISO) del cambio más reciente en este elemento. */
  at: string;
}

/** Agrupa los cambios por parte de la página, en el orden en que aparece. */
export function groupByNode(changes: AttributedChange[]): NodeChanges[] {
  const groups = new Map<string, AttributedChange[]>();
  for (const change of changes) {
    groups.set(change.node, [...(groups.get(change.node) ?? []), change]);
  }

  const rank = (node: string) => {
    const index = REGION_ORDER.indexOf(node);
    return index === -1 ? REGION_ORDER.length : index;
  };

  return [...groups.entries()]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([node, list]) => ({
      node,
      changes: list,
      authors: [...new Set(list.map((change) => change.author))],
      at: list.map((change) => change.at).sort().pop()!,
    }));
}

/** Imágenes y videos presentes en el modelo. */
export function mediaNodes(model: PreviewModel): string[] {
  return Object.entries(model)
    .filter(([key, value]) => key.endsWith("|Presencia") && value === "Agregado")
    .map(([key]) => key.slice(0, -"|Presencia".length));
}
