import type { BlockInstance } from "../site/types";
import { isHiddenOn } from "./hidden-on";
import type { AdaptiveDevice } from "./devices";

export interface AdaptSummary {
  /** Secciones que el CMS adapta solo. */
  auto: number;
  /** Secciones con diseño propio de la persona. */
  manual: number;
}

/** Cuántas secciones de la página se adaptan solas y cuántas se definieron a mano en un dispositivo. */
export function summarizeAdaptation(blocks: BlockInstance[], device: AdaptiveDevice): AdaptSummary {
  const shown = blocks.filter((block) => !block.hidden && !isHiddenOn(block.hiddenOn, device));
  const manual = shown.filter((block) => block.responsive?.[device] !== undefined).length;
  return { auto: shown.length - manual, manual };
}

/** «3 secciones adaptadas automáticamente · 1 definida a mano». */
export function describeSummary({ auto, manual }: AdaptSummary): string {
  const sections = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  return `${sections(auto, "sección adaptada automáticamente", "secciones adaptadas automáticamente")} · ${sections(manual, "definida a mano", "definidas a mano")}`;
}
