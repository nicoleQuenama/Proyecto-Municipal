/** Disposiciones de una sección (fila, columna, cuadrícula, bento) como clases de Tailwind, sin escribirlas a mano. */

export type LayoutKey = "free" | "row" | "column" | "grid2" | "grid3" | "grid4" | "bento" | "carousel";

export const LAYOUT_LABELS: Record<LayoutKey, { label: string; help: string }> = {
  free: { label: "Libre", help: "Cada elemento donde lo pusiste." },
  row: { label: "Fila", help: "Uno junto a otro; si no caben, pasan a la línea de abajo." },
  column: { label: "Columna", help: "Uno debajo de otro." },
  grid2: { label: "Cuadrícula 2", help: "Dos columnas iguales." },
  grid3: { label: "Cuadrícula 3", help: "Tres columnas iguales." },
  grid4: { label: "Cuadrícula 4", help: "Cuatro columnas iguales." },
  carousel: { label: "Carrusel", help: "Una sola fila que se desliza; cada elemento es una tarjeta. Añade botones con «Deslizar» para las flechas." },
  bento: { label: "Bento", help: "Cuadrícula de 4 columnas donde cada pieza puede ocupar varias columnas y filas." },
};

const CLASSES: Record<Exclude<LayoutKey, "free">, string> = {
  row: "flex flex-row flex-wrap gap-4 items-start",
  column: "flex flex-col gap-4",
  grid2: "grid grid-cols-2 gap-4",
  grid3: "grid grid-cols-3 gap-4",
  grid4: "grid grid-cols-4 gap-4",
  bento: "grid grid-cols-4 auto-rows-[160px] grid-flow-dense gap-4",
  carousel: "flex flex-row flex-nowrap gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&>[data-el]]:shrink-0 [&>[data-el]]:snap-start",
};

/** Lo que esta herramienta maneja de la sección: lo demás que haya escrito la persona se respeta. */
const LAYOUT_CLASS =
  /^(flex|grid|inline-flex|inline-grid|flex-(row|col|wrap|nowrap)|grid-cols-\d+|grid-flow-dense|auto-rows-\[[^\]]+\]|gap-\d+|items-(start|center|end)|overflow-x-auto|snap-x|snap-mandatory|scroll-smooth|\[scrollbar-width:none\]|\[&>\[data-el\]\]:(shrink-0|snap-start))$/;
/** Lo que maneja de un elemento dentro de una cuadrícula. */
const CELL_CLASS = /^(col-span-\d+|row-span-\d+|w-full|h-full)$/;

const words = (classes: string) => classes.split(/\s+/).filter(Boolean);
const join = (list: string[]) => list.join(" ");

/** Cambia la disposición de la sección conservando el resto de sus clases. */
export function applyLayout(classes: string, layout: LayoutKey): string {
  const rest = words(classes).filter((name) => !LAYOUT_CLASS.test(name));
  return join(layout === "free" ? rest : [...rest, ...words(CLASSES[layout])]);
}

/** Qué disposición tienen esas clases (la que coincide con un preset; si no, «Libre»). */
export function layoutOf(classes: string): LayoutKey {
  const mine = words(classes).filter((name) => LAYOUT_CLASS.test(name)).sort().join(" ");
  const found = (Object.keys(CLASSES) as Exclude<LayoutKey, "free">[]).find((key) => words(CLASSES[key]).sort().join(" ") === mine);
  return found ?? "free";
}

export const isGridLayout = (layout: LayoutKey) => layout.startsWith("grid") || layout === "bento";

export interface Cell {
  cols: number;
  rows: number;
}

/** Cuánto ocupa una pieza en la cuadrícula (1 × 1 si no dice nada). */
export function cellOf(classes: string): Cell {
  const span = (prefix: string) => Number(words(classes).find((name) => name.startsWith(prefix))?.slice(prefix.length)) || 1;
  return { cols: span("col-span-"), rows: span("row-span-") };
}

/** Pone cuántas columnas y filas ocupa una pieza; ocupando 1 × 1 y sin más, la deja como estaba. */
export function applyCell(classes: string, cell: Cell): string {
  const rest = words(classes).filter((name) => !CELL_CLASS.test(name));
  return join([...rest, "w-full", "h-full", ...(cell.cols > 1 ? [`col-span-${cell.cols}`] : []), ...(cell.rows > 1 ? [`row-span-${cell.rows}`] : [])]);
}
