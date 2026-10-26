/**
 * La barra de formato aplicada a lo seleccionado en la página (un elemento, varios o una sección).
 * Reglas puras: qué se selecciona, qué estado muestra la barra y qué acciones dispara.
 */

import type { EditScope } from "../canvas-editing/settings-context";
import { colorInputValue } from "../format/format-options";
import { elementLabel } from "../navigation/links";
import { elementChange, type EditTarget } from "../site/scope-actions";
import { TITLE_SELECTION, type CanvasElement, type ComponentDef, type ElementOverride, type SiteAction } from "../site/types";
import { FONT_OPTIONS } from "./constants";
import type { TitleState } from "./types";

/** Lo que la barra puede cambiar en los elementos (el resto de sus controles es solo del titular). */
export type BarField = "bold" | "italic" | "underline" | "strike" | "color" | "size" | "font" | "align" | "list";
export type BarState = Pick<TitleState, BarField>;

export interface FormatSelection {
  kind: "elements" | "section";
  target: EditTarget;
  /** Los elementos a los que se aplica el formato. */
  elementIds: string[];
  /** «Botón «Explorar»», «3 elementos», «sección «Tarjeta»». */
  label: string;
}

interface SelectionState {
  selectedId: string;
  selectedElementId: string | null;
  alsoSelectedIds?: string[];
}

const isTextual = (element: CanvasElement) => element.kind !== "image" && element.kind !== "video";

/**
 * Sobre qué actúa la barra: los elementos seleccionados; si solo hay una sección, todos sus textos.
 * `null` si no hay sección seleccionada (entonces actúa sobre el titular). `view` es la sección tal como se ve.
 */
export function resolveSelection(
  pageId: string,
  selection: SelectionState,
  view: ComponentDef | undefined,
  blockId: string | undefined,
): FormatSelection | null {
  if (selection.selectedId === TITLE_SELECTION || !view || !blockId) return null;
  const target: EditTarget = { pageId, blockId, componentId: view.id };

  if (selection.selectedElementId !== null) {
    const wanted = new Set([selection.selectedElementId, ...(selection.alsoSelectedIds ?? [])]);
    const chosen = view.elements.filter((element) => wanted.has(element.id));
    if (chosen.length > 0) {
      const label = chosen.length === 1 ? elementLabel(chosen[0]) : `${chosen.length} elementos`;
      return { kind: "elements", target, elementIds: chosen.map((e) => e.id), label };
    }
  }

  const texts = view.elements.filter(isTextual);
  return { kind: "section", target, elementIds: texts.map((e) => e.id), label: `sección «${view.name}»` };
}

const allTrue = (values: boolean[]) => values.length > 0 && values.every(Boolean);
/** El valor que comparten todos; si difieren, el del primero. */
const firstOf = <T>(values: T[], fallback: T): T => (values.length === 0 ? fallback : values[0]);

/** Lo que muestra la barra para estos elementos: activo si todos lo tienen, y el valor del primero. */
export function barStateOf(elements: CanvasElement[]): BarState {
  const texts = elements.filter(isTextual);
  const used = texts.length > 0 ? texts : elements;
  return {
    bold: allTrue(used.map((e) => e.bold)),
    italic: allTrue(used.map((e) => e.italic === true)),
    underline: allTrue(used.map((e) => e.underline === true)),
    strike: allTrue(used.map((e) => e.strike === true)),
    color: colorInputValue(firstOf(used.map((e) => e.color), "#000000")),
    size: firstOf(used.map((e) => e.fontSize), 16),
    font: firstOf(used.map((e) => e.fontFamily), "") || FONT_OPTIONS[0].value,
    align: firstOf(used.map((e) => e.align), "left"),
    list: firstOf(used.map((e) => e.list ?? "none"), "none"),
  };
}

/** Cómo cada control de la barra se guarda en un elemento. Un control nuevo es una entrada nueva. */
const TO_OVERRIDE: { [K in BarField]: (value: TitleState[K]) => ElementOverride } = {
  bold: (bold) => ({ bold }),
  italic: (italic) => ({ italic }),
  underline: (underline) => ({ underline }),
  strike: (strike) => ({ strike }),
  color: (color) => ({ color }),
  size: (fontSize) => ({ fontSize }),
  font: (fontFamily) => ({ fontFamily }),
  align: (align) => ({ align: align === "justify" ? "left" : align }),
  list: (list) => ({ list }),
};

/** El cambio de la barra, convertido al formato de un elemento. Lo que no vale para elementos se ignora. */
export function patchToOverride(patch: Partial<TitleState>): ElementOverride {
  const entries = (Object.keys(TO_OVERRIDE) as BarField[])
    .filter((field) => field in patch)
    .map((field) => (TO_OVERRIDE[field] as (value: unknown) => ElementOverride)(patch[field]));
  return Object.assign({}, ...entries);
}

/** Las acciones que aplican un cambio de la barra a la selección, según el alcance elegido. */
export function formatActions(scope: EditScope, selection: FormatSelection, patch: Partial<TitleState>): SiteAction[] {
  const override = patchToOverride(patch);
  if (Object.keys(override).length === 0 || selection.elementIds.length === 0) return [];

  // Solo este bloque: una sola acción para todos; todo el componente: una por elemento.
  if (scope === "block") {
    const { pageId, blockId } = selection.target;
    return [{ type: "block/style", pageId, blockId, elementIds: selection.elementIds, patch: override }];
  }
  return selection.elementIds.map((id) => elementChange(scope, selection.target, id, override));
}
