/**
 * A qué se refiere cada archivo del editor: una página, una sección o un elemento. Con eso el editor puede
 * decir «esto aplica a…», dar el selector ya hecho, ofrecer los elementos de la sección y saltar entre los
 * archivos del mismo destino (estilos, código…).
 */

import { elementLabel } from "../navigation/links";
import { targetKey } from "../site/custom-code";
import { SECTION_KEY, type SiteState } from "../site/types";
import type { FileKindName, FileRef } from "./file-ref";
import { pageOutline, sectionOutline, type OutlineLine } from "./outline";

export interface FileTarget {
  /** Dicho en palabras: «Elemento «Botón» · Banner & Hero CTA». */
  label: string;
  /** El selector CSS que identifica el destino en la página, si lo tiene. */
  selector: string | null;
  /** Los elementos de la sección a los que el código puede apuntar. */
  elements: { id: string; label: string }[];
  /** El HTML del destino, una línea por etiqueta, para elegir selectores sin adivinarlos. Vacío si no aplica. */
  outline: OutlineLine[];
  /** Los archivos de este mismo destino, para cambiar de uno a otro sin buscar en el explorador. */
  siblings: { ref: FileRef; label: string }[];
  /** De dónde se puede añadir una interacción de código nueva (secciones y elementos). */
  scope?: { pageId: string; blockId: string; key: string };
}

const pageOf = (site: SiteState, pageId: string) => site.pages.find((p) => p.id === pageId);
const blockOf = (site: SiteState, pageId: string, blockId: string) =>
  pageOf(site, pageId)?.blocks.find((b) => b.id === blockId);

/** Una sección (`SECTION_KEY`) o uno de sus elementos. */
function scopeTarget(site: SiteState, pageId: string, blockId: string, key: string): FileTarget | null {
  const block = blockOf(site, pageId, blockId);
  const def = site.components.find((c) => c.id === block?.componentId);
  if (!block || !def) return null;

  const element = key === SECTION_KEY ? undefined : def.elements.find((e) => e.id === key);
  const behaviors = (block.behaviors ?? []).filter((b) => b.scope === key && b.action.kind === "code");

  return {
    label: element ? `Elemento «${elementLabel(element)}» · ${def.name}` : `Sección «${def.name}»`,
    selector: `[data-target="${targetKey(blockId, key)}"]`,
    elements: element ? [] : def.elements.map((e) => ({ id: e.id, label: elementLabel(e) })),
    outline: sectionOutline(site, pageId, blockId, key),
    siblings: [
      { ref: { kind: "custom-css", pageId, blockId, key }, label: "Estilos · CSS" },
      ...behaviors.map((b, index) => ({
        ref: { kind: "behavior-js", pageId, blockId, behaviorId: b.id } as FileRef,
        label: `${b.name?.trim() || `Código ${index + 1}`} · TS`,
      })),
    ],
    scope: { pageId, blockId, key },
  };
}

/** Un bloque de código: su HTML, su CSS y su TypeScript. */
function codeBlockTarget(site: SiteState, pageId: string, blockId: string): FileTarget | null {
  if (!blockOf(site, pageId, blockId)?.code) return null;
  return {
    label: "Bloque de código",
    selector: `[data-target="${targetKey(blockId, SECTION_KEY)}"]`,
    elements: [],
    outline: [],
    siblings: [
      { ref: { kind: "block-html", pageId, blockId }, label: "HTML" },
      { ref: { kind: "block-css", pageId, blockId }, label: "CSS" },
      { ref: { kind: "block-js", pageId, blockId }, label: "TypeScript" },
    ],
  };
}

function pageTarget(site: SiteState, pageId: string): FileTarget | null {
  const page = pageOf(site, pageId);
  if (!page) return null;
  return {
    label: `Página «${page.name}»`,
    selector: `[data-page-id="${page.id}"] [data-site-page]`,
    elements: [],
    outline: pageOutline(site, pageId),
    siblings: [
      { ref: { kind: "page-css", pageId }, label: "Estilos · CSS" },
      { ref: { kind: "page-js", pageId }, label: "Código · TS" },
    ],
  };
}

/** Cómo se obtiene el destino de cada tipo de archivo. Un tipo de archivo nuevo es una entrada nueva. */
const TARGETS: { [K in FileKindName]: (site: SiteState, ref: Extract<FileRef, { kind: K }>) => FileTarget | null } = {
  "global-css": () => ({
    label: "Todo el sitio",
    selector: "[data-site-page]",
    elements: [],
    outline: [],
    siblings: [{ ref: { kind: "global-css" }, label: "Estilos globales · CSS" }],
  }),
  "page-css": (site, ref) => pageTarget(site, ref.pageId),
  "page-js": (site, ref) => pageTarget(site, ref.pageId),
  "block-html": (site, ref) => codeBlockTarget(site, ref.pageId, ref.blockId),
  "block-css": (site, ref) => codeBlockTarget(site, ref.pageId, ref.blockId),
  "block-js": (site, ref) => codeBlockTarget(site, ref.pageId, ref.blockId),
  "custom-css": (site, ref) => scopeTarget(site, ref.pageId, ref.blockId, ref.key),
  "component-css": (site, ref) => {
    const def = site.components.find((c) => c.id === ref.componentId);
    if (!def) return null;
    const element = def.elements.find((e) => e.id === ref.key);
    return {
      label: `${element ? `Elemento «${elementLabel(element)}»` : "Sección"} en todos los «${def.name}»`,
      selector: element ? `[data-component="${def.id}"] [data-el="${element.id}"]` : `[data-component="${def.id}"] [data-canvas]`,
      elements: [],
      outline: [],
      siblings: [{ ref, label: "Estilos de todos · CSS" }],
    };
  },
  "behavior-js": (site, ref) => {
    const behavior = blockOf(site, ref.pageId, ref.blockId)?.behaviors?.find((b) => b.id === ref.behaviorId);
    return behavior ? scopeTarget(site, ref.pageId, ref.blockId, behavior.scope) : null;
  },
  function: (site, ref) => {
    const fn = site.functions.find((f) => f.id === ref.functionId);
    return fn ? { label: `Función «${fn.name}»`, selector: null, elements: [], outline: [], siblings: [] } : null;
  },
};

/** El destino de un archivo, o `null` si ya no existe. */
export const fileTarget = (site: SiteState, ref: FileRef): FileTarget | null =>
  (TARGETS[ref.kind] as (site: SiteState, ref: FileRef) => FileTarget | null)(site, ref);
