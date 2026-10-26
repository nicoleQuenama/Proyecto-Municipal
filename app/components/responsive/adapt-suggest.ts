import { isFlowLayout } from "../site/custom-code";
import { applyOverrides } from "../site/overrides";
import { SECTION_KEY, type BlockInstance, type ComponentDef } from "../site/types";
import { adaptToDevice } from "./adapt";
import type { AdaptiveDevice } from "./devices";
import { FOLD_DEFAULTS } from "./fold-model";
import { isHiddenOn } from "./hidden-on";
import { defaultMenu } from "./menu-model";
import type { AutoStrategy, FoldConfig } from "./types";

export type SuggestionKind = "menu" | "carousel" | "more";

/** Lo que el asistente propone para una sección, con la razón en lenguaje llano. */
export interface Suggestion {
  blockId: string;
  kind: SuggestionKind;
  strategy?: AutoStrategy;
  fold?: FoldConfig;
  reason: string;
}

export interface SuggestContext {
  device: AdaptiveDevice;
  /** Ancho que tiene una sección en ese dispositivo. */
  available: number;
  /** Cuántas copias saca una sección repetida (0 si no se sabe aún). */
  copies: (block: BlockInstance) => number;
}

/** Más copias que estas hacen larga una lista: conviene un carrusel. */
export const MAX_STACKED_COPIES = 3;
/** Más alta que esto (px) una sección ya adaptada se recorta con «Ver más». */
export const TALL_SECTION = 640;
const TRIMMED_TO = 360;
/** Una cabecera sin categoría de navegación: enlaces en fila cerca del borde de arriba. */
const HEADER_MAX_HEIGHT = 140;
const ROW_TOLERANCE = 24;
const MIN_LINKS = 3;

/** ¿Parece una cabecera? Categoría de navegación, o una fila de enlaces cerca del borde superior. */
export function looksLikeHeader(def: ComponentDef): boolean {
  if (def.category === "navigation") return true;
  const linked = def.elements.filter((e) => !e.hidden && def.links[e.id] !== undefined);
  if (linked.length < MIN_LINKS || def.height > HEADER_MAX_HEIGHT) return false;
  const centers = linked.map((e) => e.y + e.height / 2);
  return Math.max(...centers) - Math.min(...centers) <= ROW_TOLERANCE;
}

type Rule = (block: BlockInstance, def: ComponentDef, adapted: ComponentDef, ctx: SuggestContext) => Suggestion | null;

/** Las reglas por orden de importancia: la primera que aplica gana. */
const RULES: Rule[] = [
  (block, def, adapted, { available }) =>
    looksLikeHeader(def) && def.width > available && defaultMenu(def).itemIds.length >= 2
      ? { blockId: block.id, kind: "menu", strategy: "menu", reason: "parece una cabecera: sus enlaces pasan a un menú" }
      : null,
  (block, _def, _adapted, ctx) =>
    block.repeat && ctx.copies(block) > MAX_STACKED_COPIES
      ? { blockId: block.id, kind: "carousel", fold: FOLD_DEFAULTS.carousel, reason: "es una lista larga: pasa a carrusel" }
      : null,
  (block, _def, adapted) =>
    adapted.height > TALL_SECTION
      ? { blockId: block.id, kind: "more", fold: { kind: "more", maxHeight: TRIMMED_TO, moreLabel: "Ver más", lessLabel: "Ver menos" }, reason: "queda muy alta: se recorta con «Ver más»" }
      : null,
];

/** La sugerencia para una sección en un dispositivo; `null` si ya está bien o la persona ya eligió algo. */
export function suggestFor(block: BlockInstance, def: ComponentDef, ctx: SuggestContext): Suggestion | null {
  const { device } = ctx;
  const decided = block.hidden || block.code || isHiddenOn(block.hiddenOn, device) || block.responsive?.[device] || block.adapt?.[device] || block.fold?.[device];
  if (decided || isFlowLayout(def.styles?.[SECTION_KEY], block.custom?.[SECTION_KEY])) return null;

  const formatted = applyOverrides(def, block, () => undefined);
  const adapted = adaptToDevice(formatted, block, device, false, ctx.available);
  for (const rule of RULES) {
    const found = rule(block, formatted, adapted, ctx);
    if (found) return found;
  }
  return null;
}

/** Las sugerencias para todas las secciones de una página. */
export function suggestAll(blocks: BlockInstance[], components: ComponentDef[], ctx: SuggestContext): Suggestion[] {
  return blocks.flatMap((block) => {
    const def = components.find((c) => c.id === block.componentId);
    const found = def && suggestFor(block, def, ctx);
    return found ? [found] : [];
  });
}

const LABELS: Record<SuggestionKind, [string, string]> = {
  menu: ["menú", "menús"],
  carousel: ["carrusel", "carruseles"],
  more: ["«Ver más»", "«Ver más»"],
};

/** «3 sugerencias: 1 menú, 1 carrusel, 1 «Ver más»». */
export function describeSuggestions(list: Suggestion[]): string {
  if (list.length === 0) return "Sin sugerencias: todo se ve bien";
  const parts = (Object.keys(LABELS) as SuggestionKind[])
    .map((kind) => [kind, list.filter((s) => s.kind === kind).length] as const)
    .filter(([, n]) => n > 0)
    .map(([kind, n]) => `${n} ${LABELS[kind][n === 1 ? 0 : 1]}`);
  return `${list.length} ${list.length === 1 ? "sugerencia" : "sugerencias"}: ${parts.join(", ")}`;
}
