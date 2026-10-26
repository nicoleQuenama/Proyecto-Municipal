"use client";

import { useSite, useCurrentPage } from "../site/site-context";
import { applyOverrides } from "../site/overrides";
import type { CanvasElement } from "../site/types";
import { useStyles } from "../styles/use-styles";
import { resolveSelection, type FormatSelection } from "./selection-format";

/** Sobre qué actúa ahora la barra de formato y los elementos (ya con su formato) a los que afecta. `null`: el titular. */
export function useFormatSelection(): { selection: FormatSelection; elements: CanvasElement[] } | null {
  const site = useSite();
  const page = useCurrentPage();
  const styles = useStyles(page.id);

  const block = page.blocks.find((b) => b.id === site.selectedId);
  const def = site.components.find((c) => c.id === block?.componentId);
  if (!block || !def) return null;

  const view = applyOverrides(styles.component(def), block, styles.resolver(def.id));
  const selection = resolveSelection(page.id, site, view, block.id);
  if (!selection) return null;

  return { selection, elements: view.elements.filter((e) => selection.elementIds.includes(e.id)) };
}
