/**
 * El HTML de lo que se está editando, tal como lo ve el código: una línea por etiqueta. No se lee del DOM (allí hay
 * ojos, selecciones y otros adornos del editor): se arma a partir del sitio, con los mismos `data-target` y
 * `data-el` que lleva la página de verdad.
 */

import { elementLabel } from "../navigation/links";
import { targetKey } from "../site/custom-code";
import { SECTION_KEY, type BlockInstance, type CanvasElement, type ComponentDef, type SiteState } from "../site/types";

export interface OutlineLine {
  id: string;
  depth: number;
  /** La línea de HTML, p. ej. `<div data-el="e4">Empezar</div>`. */
  code: string;
  /** Con nombre y en palabras: «Botón «Empezar»». */
  label: string;
  /** El selector que se inserta al pulsarla; `null` si la línea no se puede elegir (cierres). */
  selector: string | null;
  /** Es el destino del archivo abierto. */
  current: boolean;
}

const MAX_TEXT = 36;

const shorten = (text: string) => {
  const flat = text.trim().replace(/\s+/g, " ");
  return flat.length > MAX_TEXT ? `${flat.slice(0, MAX_TEXT - 1)}…` : flat;
};

/** Cómo se ve un elemento en HTML: las imágenes son `<img>`, el resto una caja con su texto. */
const ELEMENT_CODE: Record<CanvasElement["kind"], (element: CanvasElement) => string> = {
  image: (element) => `<img data-el="${element.id}"${element.src ? ` src="${shorten(element.src)}"` : ""}>`,
  video: (element) => `<${element.embed ? "iframe" : "video"} data-el="${element.id}"${element.src ? ` src="${shorten(element.src)}"` : ""}>`,
  text: (element) => `<div data-el="${element.id}">${shorten(element.text)}</div>`,
  rect: (element) => `<div data-el="${element.id}">${shorten(element.text)}</div>`,
  ellipse: (element) => `<div data-el="${element.id}">${shorten(element.text)}</div>`,
};

/** Cómo se elige una parte: dentro de su sección basta `data-el`; desde la página hace falta `data-target`. */
export type SelectorScope = "section" | "page";

function sectionLines(
  block: BlockInstance,
  def: ComponentDef,
  scope: SelectorScope,
  currentKey: string | null,
): OutlineLine[] {
  const selectorOf = (key: string) =>
    key === SECTION_KEY || scope === "page" ? `[data-target="${targetKey(block.id, key)}"]` : `[data-el="${key}"]`;

  return [
    {
      id: `${block.id}:open`,
      depth: 0,
      code: `<div data-target="${targetKey(block.id, SECTION_KEY)}">`,
      label: `Sección «${def.name}»`,
      selector: selectorOf(SECTION_KEY),
      current: currentKey === SECTION_KEY,
    },
    ...def.elements
      .filter((element) => !element.hidden)
      .map<OutlineLine>((element) => ({
        id: `${block.id}:${element.id}`,
        depth: 1,
        code: ELEMENT_CODE[element.kind](element),
        label: elementLabel(element),
        selector: selectorOf(element.id),
        current: currentKey === element.id,
      })),
    { id: `${block.id}:close`, depth: 0, code: "</div>", label: "", selector: null, current: false },
  ];
}

/** El HTML de una sección y sus elementos. `currentKey`: qué parte es el destino del archivo. */
export function sectionOutline(site: SiteState, pageId: string, blockId: string, currentKey: string): OutlineLine[] {
  const block = site.pages.find((p) => p.id === pageId)?.blocks.find((b) => b.id === blockId);
  const def = site.components.find((c) => c.id === block?.componentId);
  return block && def ? sectionLines(block, def, "section", currentKey) : [];
}

/** El HTML de toda la página: sus secciones, una tras otra. */
export function pageOutline(site: SiteState, pageId: string): OutlineLine[] {
  const page = site.pages.find((p) => p.id === pageId);
  if (!page) return [];

  return page.blocks.flatMap((block) => {
    const def = site.components.find((c) => c.id === block.componentId);
    return def && !block.code ? sectionLines(block, def, "page", null) : [];
  });
}
