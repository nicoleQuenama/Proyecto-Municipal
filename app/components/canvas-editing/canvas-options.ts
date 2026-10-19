/** Las opciones de ayuda y de alcance del lienzo: qué dice cada una. Una opción nueva es una entrada nueva. */

import type { EditScope } from "./settings-context";

/** Ayudas que se activan y desactivan. */
export const CANVAS_TOGGLES: { key: "grid" | "snap"; label: string; hint: string }[] = [
  { key: "grid", label: "Cuadrícula", hint: "Muestra la cuadrícula; los elementos se pegan a ella" },
  {
    key: "snap",
    label: "Guías",
    hint: "Los elementos se alinean con los bordes y centros de los demás (Ctrl al arrastrar lo desactiva)",
  },
];

/** A qué se aplican los cambios hechos en la página. */
export const EDIT_SCOPES: { value: EditScope; label: string; hint: string }[] = [
  { value: "block", label: "Solo este bloque", hint: "Mover, estirar o acoplar solo cambia este bloque" },
  { value: "component", label: "Todos los bloques del componente", hint: "El cambio vale en todos los lugares donde se usa" },
];
