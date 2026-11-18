import { sharedDefOf } from "../site/code-source";
import type { BlockKind } from "../site/code-kind-rules";
import type { BlockInstance, ComponentDef, Page } from "../site/types";

/** Cómo se llama cada tipo de bloque de código. Un tipo nuevo es una entrada nueva. */
export const KIND_LABELS: Record<BlockKind, string> = {
  loose: "Suelto",
  component: "Componente",
  template: "Plantilla",
};

/** Cómo se explica cada tipo, en una frase. */
export const KIND_HINTS: Record<BlockKind, string> = {
  loose: "Solo existe en este lugar.",
  component: "Una sola definición: si cambia, cambia en todos los lugares donde se use.",
  template: "Un molde: cada copia colocada tiene su propio código y sus propios datos.",
};

/** El tipo con el que cuenta el bloque ahora mismo. */
export function kindOf(block: BlockInstance, components: ComponentDef[]): BlockKind {
  if (sharedDefOf(block, components)) return "component";
  return components.find((c) => c.id === block.componentId)?.codeKind === "template" ? "template" : "loose";
}

/** En cuántos lugares se usa una definición. */
export const usesOf = (componentId: string, pages: Page[]): number =>
  pages.reduce((sum, page) => sum + page.blocks.filter((b) => b.componentId === componentId).length, 0);
