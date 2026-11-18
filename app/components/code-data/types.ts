/** Un valor simple que el modal sabe editar. */
export type CellValue = string | number | boolean;

/** Un campo de un objeto del código. `value: null` es un valor calculado (no se puede editar desde el lienzo). */
export interface DataCell {
  key: string;
  value: CellValue | null;
  /** Posición del literal del valor en el código (con sus comillas). */
  start: number;
  end: number;
}

/** Un objeto `{ … }` dentro de un arreglo (o el propio objeto suelto). */
export interface DataRow {
  start: number;
  end: number;
  cells: DataCell[];
}

/** Un `const x = [ {…}, … ]` (lista) o `const x = { … }` (objeto) que el código usa. */
export interface DataSet {
  name: string;
  kind: "list" | "object";
  rows: DataRow[];
  /** Los corchetes o llaves del literal completo. */
  start: number;
  end: number;
}
