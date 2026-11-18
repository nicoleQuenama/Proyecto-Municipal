import { findData } from "./find-data";
import type { CellValue, DataRow, DataSet } from "./types";

export type DataChange =
  | { type: "set"; set: number; row: number; key: string; value: CellValue }
  | { type: "add-row"; set: number }
  | { type: "remove-row"; set: number; row: number }
  | { type: "move-row"; set: number; row: number; to: number };

/** Cómo se escribe un texto con cada tipo de comilla. */
const QUOTED: Record<string, (text: string) => string> = {
  '"': (t) => JSON.stringify(t),
  "'": (t) => `'${t.replace(/[\\']/g, "\\$&").replace(/\n/g, "\\n").replace(/\r/g, "\\r")}'`,
  "`": (t) => `\`${t.replace(/[\\`]/g, "\\$&").replace(/\$\{/g, "\\${")}\``,
};

/** El literal de un valor, con la comilla del literal que reemplaza (`original`). */
const literal = (value: CellValue, original: string): string =>
  typeof value === "string" ? (QUOTED[original[0]] ?? QUOTED['"'])(value) : String(value);

/** Cambia el texto entre dos posiciones. */
const splice = (source: string, start: number, end: number, text: string) => source.slice(0, start) + text + source.slice(end);

/** Lo que hay entre `from` y la siguiente coma (espacios incluidos), o `null` si no hay coma pegada. */
const commaAfter = (source: string, from: number): { at: number; end: number } | null => {
  const found = /^\s*,/.exec(source.slice(from));
  return found ? { at: from + found[0].length - 1, end: from + found[0].length } : null;
};

/** El valor en blanco que corresponde al literal de una celda. */
const blank = (original: string): string => {
  if (/^["'`]/.test(original)) return literal("", original);
  if (original === "true" || original === "false") return "false";
  return /^[\d.+-]/.test(original) ? "0" : original;
};

function addRow(source: string, set: DataSet): string {
  const last = set.rows[set.rows.length - 1];
  let text = source.slice(last.start, last.end);
  // De atrás hacia adelante, para que las posiciones anteriores no cambien.
  for (const cell of [...last.cells].reverse()) {
    text = splice(text, cell.start - last.start, cell.end - last.start, blank(source.slice(cell.start, cell.end)));
  }
  const lineStart = source.lastIndexOf("\n", last.start) + 1;
  const indent = /^\s*/.exec(source.slice(lineStart, last.start))?.[0] ?? "";
  return splice(source, last.end, last.end, `,\n${indent}${text}`);
}

function removeRow(source: string, set: DataSet, index: number): string {
  const rows = set.rows;
  const row = rows[index];
  // Entre filas: se va la fila y lo que sigue hasta la siguiente (su coma y el comentario de su línea).
  if (index < rows.length - 1) return splice(source, row.start, rows[index + 1].start, "");

  // La última: se quita ella y su coma final, y la coma que la separaba de la anterior.
  const trailing = commaAfter(source, row.end);
  const withoutRow = splice(source, row.start, trailing?.end ?? row.end, "");
  const separator = rows.length > 1 ? commaAfter(source, rows[index - 1].end) : null;
  return separator ? splice(withoutRow, separator.at, separator.at + 1, "") : withoutRow;
}

function moveRow(source: string, rows: DataRow[], from: number, to: number): string {
  if (from === to || !rows[from] || !rows[to]) return source;
  const [first, second] = from < to ? [rows[from], rows[to]] : [rows[to], rows[from]];
  const a = source.slice(first.start, first.end);
  const b = source.slice(second.start, second.end);
  return splice(splice(source, second.start, second.end, a), first.start, first.end, b);
}

/** Aplica un cambio del modal al código y devuelve el código nuevo. Solo toca lo que cambia; el resto queda igual. */
export function applyChange(source: string, change: DataChange): string {
  const set = findData(source)[change.set];
  if (!set) return source;

  if (change.type === "add-row") return set.kind === "list" ? addRow(source, set) : source;
  if (change.type === "remove-row") return set.rows[change.row] ? removeRow(source, set, change.row) : source;
  if (change.type === "move-row") return moveRow(source, set.rows, change.row, change.to);

  const cell = set.rows[change.row]?.cells.find((c) => c.key === change.key);
  if (!cell || cell.value === null) return source;
  return splice(source, cell.start, cell.end, literal(change.value, source.slice(cell.start, cell.end)));
}
