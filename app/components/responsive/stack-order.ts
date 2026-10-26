import type { Frame } from "./types";

/** Cuánto se debe solapar algo con un grupo (frente al más pequeño de los dos) para contar como «la misma fila». */
const OVERLAP = 0.3;

interface Span<T> {
  start: number;
  end: number;
  items: T[];
}

/** Junta en grupos lo que se solapa en un eje (barrido por inicio): filas si el eje es vertical, columnas si es horizontal. */
function clusters<T extends Frame>(items: T[], axis: "x" | "y"): T[][] {
  const size = axis === "x" ? "width" : "height";
  const sorted = [...items].sort((a, b) => a[axis] - b[axis]);
  const groups: Span<T>[] = [];

  for (const item of sorted) {
    const last = groups[groups.length - 1];
    const overlap = last ? last.end - item[axis] : 0;
    if (last && overlap > OVERLAP * Math.min(item[size], last.end - last.start)) {
      last.end = Math.max(last.end, item[axis] + item[size]);
      last.items.push(item);
    } else {
      groups.push({ start: item[axis], end: item[axis] + item[size], items: [item] });
    }
  }
  return groups.map((group) => group.items);
}

/**
 * El orden de lectura de una sección apilada: las filas de arriba abajo; dentro de una fila, las columnas de
 * izquierda a derecha, y dentro de cada columna, de arriba abajo.
 */
export function stackOrder<T extends Frame>(items: T[]): T[] {
  return clusters(items, "y").flatMap((row) =>
    clusters(row, "x").flatMap((column) => [...column].sort((a, b) => a.y - b.y)),
  );
}
