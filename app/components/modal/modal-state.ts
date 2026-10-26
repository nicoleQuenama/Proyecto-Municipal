/** Qué ventana modal abre un enlace (puro, sin React). */

import { effectiveParams } from "../dynamic/route-params";
import type { LinkTarget } from "../navigation/types";
import type { Page } from "../site/types";
import { resolveModalOptions } from "./modal-options";
import type { OpenModal } from "./types";

/** La ventana que abre un enlace «modal»; null si la página ya no existe. */
export function openModalFor(link: Extract<LinkTarget, { kind: "modal" }>, pages: Page[]): OpenModal | null {
  const page = pages.find((p) => p.id === link.pageId);
  if (!page) return null;
  return {
    pageId: page.id,
    values: effectiveParams(page.route, page.previewParams, link.params),
    options: resolveModalOptions(link.options),
  };
}
