"use client";

import { useMemo, type ReactNode } from "react";
import { ParamsContext, usePageParams } from "../dynamic/params-context";
import type { BlockInstance } from "../site/types";
import { clampSize, pagingParams } from "./paging";
import { usePagingState } from "./paging-store";

/**
 * Para todo lo que hay dentro de una sección paginada, la página en pantalla viaja con los parámetros de la página:
 * las fuentes que usan `{page}`, `{offset}` o `{limit}` en su URL piden justo la página que se ve.
 */
export function PagingScope({ block, children }: { block: BlockInstance; children: ReactNode }) {
  const outer = usePageParams();
  const { page } = usePagingState(block.id);
  const size = block.repeatPaging ? clampSize(block.repeatPaging.size) : 0;
  const params = useMemo(() => ({ ...outer, ...pagingParams({ page, size }) }), [outer, page, size]);
  return <ParamsContext.Provider value={params}>{children}</ParamsContext.Provider>;
}
