"use client";

import { useCallback } from "react";
import { peek } from "../data-sources/source-store";
import { useRepeatIndex } from "../data-sources/repeat-context";
import { useSite } from "../site/site-context";
import type { BlockInstance } from "../site/types";
import type { LinkTarget } from "../navigation/types";
import { resolveLinkParams } from "./link-values";
import { usePageParams } from "./params-context";

/**
 * Devuelve una función que, al seguir un enlace a una página, le pone los valores de sus parámetros:
 * los textos escritos y los datos de la copia de la sección que se está viendo.
 */
export function useLinkResolver(block: BlockInstance) {
  const { sources } = useSite();
  const index = useRepeatIndex();
  const params = usePageParams();

  return useCallback(
    (link: LinkTarget, elementId: string): LinkTarget => {
      if ((link.kind !== "page" && link.kind !== "modal") || !block.linkParams?.[elementId]) return link;

      const read = (sourceId: string) => {
        const source = sources.find((s) => s.id === sourceId);
        return source ? peek(source, params).data : undefined;
      };
      return { ...link, params: resolveLinkParams(block.linkParams[elementId], read, block.repeat, index) };
    },
    [block.linkParams, block.repeat, sources, index, params],
  );
}
