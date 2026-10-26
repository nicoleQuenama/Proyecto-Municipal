"use client";

import { useEffect, useRef } from "react";
import { useSite } from "../site/site-context";
import type { BlockInstance } from "../site/types";
import { goToPage, rememberList, usePagingState } from "./paging-store";
import { clampSize, pagerModel, windowOf, type PagerModel } from "./paging";
import { getPath } from "./paths";
import { MAX_REPEAT } from "./resolve";
import { usesServerPaging } from "./url-tokens";

export interface PagedList {
  /** Primer elemento de la lista que se dibuja y cuántos (copias de la sección). */
  start: number;
  count: number;
  model: PagerModel;
  goTo: (page: number) => void;
}

/**
 * La página que se ve de una sección paginada. Con una URL que lleva `{page}` u `{offset}` el servidor ya entrega solo
 * esa página (se dibuja entera); si no, se recorta la lista completa. Devuelve null si la sección no está paginada.
 */
export function usePagedList(block: BlockInstance, data: unknown): PagedList | null {
  const { sources } = useSite();
  const stored = usePagingState(block.id);
  const paging = block.repeatPaging;
  const repeat = block.repeat;
  const source = sources.find((s) => s.id === repeat?.sourceId);
  const server = !!source && usesServerPaging(source.url, ...source.query.map((q) => q.value));

  const list = repeat && data !== undefined ? getPath(data, repeat.path) : undefined;
  const length = Array.isArray(list) ? list.length : 0;
  const totalValue = paging?.totalPath && data !== undefined ? Number(getPath(data, paging.totalPath)) : NaN;
  const total = server ? (Number.isFinite(totalValue) ? totalValue : null) : length;

  // Cuando los datos cambian de verdad (otra API, otro total) se vuelve a la página 1, si así se pidió.
  const signature = JSON.stringify([source?.url, source?.query, source?.transform, repeat?.path, server ? total : length]);
  const previous = useRef<string | null>(null);
  const ready = data !== undefined;
  useEffect(() => {
    if (!paging || !ready) return;
    rememberList(block.id, total, length);
    if (paging.resetOnChange && previous.current !== null && previous.current !== signature) goToPage(block.id, 1);
    previous.current = signature;
  }, [paging, ready, block.id, total, length, signature]);

  if (!paging) return null;
  const size = clampSize(paging.size);
  const known = ready ? { total, shown: length } : stored;
  const model = pagerModel(stored.page, size, known.total, known.shown);
  const window = server ? { start: 0, count: Math.min(length, MAX_REPEAT) } : windowOf(length, { page: model.page, size });

  return { ...window, model, goTo: (page) => goToPage(block.id, page) };
}
