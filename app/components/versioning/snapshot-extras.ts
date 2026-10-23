import { PATCH_KINDS } from "../external-site/patch-kinds";
import type { ExternalState } from "../external-site/types";
import type { BlockInstance } from "../site/types";

export type Add = (key: string, node: string, property: string, value: string) => void;

/** Huella corta de un valor, para detectar que cambió sin guardarlo entero. */
export const hashOf = (value: unknown): string => {
  let hash = 5381;
  for (const char of JSON.stringify(value)) hash = ((hash * 33) ^ char.charCodeAt(0)) >>> 0;
  return hash.toString(36).slice(0, 5);
};

/** El diseño propio de cada dispositivo de una sección (tablet y móvil definidos a mano). */
export function addResponsive(add: Add, node: string, block: BlockInstance) {
  for (const [device, layout] of Object.entries(block.responsive ?? {})) {
    add(`responsive:${block.id}:${device}`, node, `Diseño para ${device === "mobile" ? "móvil" : "tablet"}`, hashOf(layout));
  }
}

/** La web existente del cliente: sus cambios, sus páginas nuevas y la adaptación automática. */
export function addExternal(add: Add, external: Pick<ExternalState, "site" | "patches" | "pages" | "autoResponsive">) {
  if (!external.site) return;
  const site = `Sitio · ${external.site}`;

  add("external:auto", site, "Adaptación automática", external.autoResponsive ? "Sí" : "No");
  for (const patch of external.patches) {
    const where = patch.path === "*" ? "todo el sitio" : patch.path;
    add(`external:patch:${patch.id}`, `${site} · ${where} · ${patch.label}`, PATCH_KINDS[patch.kind].label, PATCH_KINDS[patch.kind].summary(patch));
  }
  for (const page of external.pages) {
    add(`external:page:${page.id}`, `${site} · Página nueva`, page.path, `${page.title} · ${hashOf(page.html)}`);
  }
}
