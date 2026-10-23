"use client";

import { useMemo } from "react";
import { targetKey } from "../site/custom-code";
import { applyOverrides } from "../site/overrides";
import { useCurrentPage, useSite } from "../site/site-context";
import { PLACE_KEY, SECTION_KEY } from "../site/types";
import { useStyles } from "../styles/use-styles";
import type { ValueMap } from "./diff";

/** Lo que se ve ahora de cada sección y de cada elemento visible de la página actual (con reglas y formato aplicados). */
export function usePageValues(): ValueMap {
  const { components } = useSite();
  const page = useCurrentPage();
  const styles = useStyles();

  return useMemo(() => {
    const map: ValueMap = {};

    for (const block of page.blocks) {
      const def = components.find((c) => c.id === block.componentId);
      if (!def || block.hidden || block.code) continue;

      const view = applyOverrides(styles.component(def), block, styles.resolver(def.id));
      map[targetKey(block.id, SECTION_KEY)] = {
        blockId: block.id,
        key: SECTION_KEY,
        values: { width: view.width, height: view.height },
      };

      if (block.placement) {
        const { x, y } = block.placement;
        map[targetKey(block.id, PLACE_KEY)] = { blockId: block.id, key: PLACE_KEY, values: { x, y } };
      }

      for (const { id, hidden, x, y, width, height, fill, color, fontSize, radius } of view.elements) {
        if (hidden) continue;
        map[targetKey(block.id, id)] = { blockId: block.id, key: id, values: { x, y, width, height, fill, color, fontSize, radius } };
      }
    }
    return map;
  }, [page.blocks, components, styles]);
}
