import type { SiteAction } from "../site/types";
import type { AuditElement } from "./page-elements";
import type { ElementOverride } from "../site/types";

/** Cambia el formato de un elemento solo en su bloque. */
export const styleAction = (pageId: string, a: AuditElement, patch: ElementOverride): SiteAction => ({
  type: "block/style",
  pageId,
  blockId: a.block.id,
  elementIds: [a.element.id],
  patch,
});

/** Un nombre legible a partir del nombre de archivo o la URL («foto-plaza_2.jpg» → «foto plaza 2»). */
export function suggestAlt(src: string, name?: string): string {
  const raw = name || (src.startsWith("data:") ? "" : (src.split(/[?#]/)[0].split("/").pop() ?? ""));
  const clean = decodeURIComponent(raw).replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[-_]+/g, " ").trim();
  return clean || "Describe lo que muestra la imagen";
}

/** Peso aproximado en KB de un archivo subido (data URL); 0 si es una URL normal. */
export function dataUrlKb(src: string): number {
  if (!src.startsWith("data:")) return 0;
  const comma = src.indexOf(",");
  return Math.round(((src.length - comma - 1) * 3) / 4 / 1024);
}

/** Cantidad de coincidencias de una expresión en un texto. */
export const countMatches = (text: string, pattern: RegExp): number => text.match(pattern)?.length ?? 0;
