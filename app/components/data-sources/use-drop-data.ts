"use client";

import { useCallback } from "react";
import { usePageParams } from "../dynamic/params-context";
import { useSite, useSiteDispatch } from "../site/site-context";
import type { BlockInstance, CanvasElement } from "../site/types";
import { planDrop } from "./drop-plan";
import { peek } from "./source-store";
import type { DataRef } from "./types";

/** Qué hace una sección al soltarle una clave de una API: enlazar, repetir o rellenar, según el tipo de dato. */
export function useDropData(pageId: string, block: BlockInstance, elements: CanvasElement[]) {
  const { sources } = useSite();
  const dispatch = useSiteDispatch();
  const params = usePageParams();

  return useCallback(
    (ref: DataRef, elementId: string | null) => {
      const source = sources.find((s) => s.id === ref.sourceId);
      const state = source && peek(source, params);
      if (!state || state.data === undefined) return;

      const bound = Object.keys(block.bindings ?? {});
      planDrop(ref, { pageId, blockId: block.id, elementId, elements, bound, data: state.data }).forEach(dispatch);
    },
    [sources, params, dispatch, pageId, block.id, block.bindings, elements],
  );
}
