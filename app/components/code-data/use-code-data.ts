"use client";

import { useCallback, useEffect, useState } from "react";
import { useSite, useSiteDispatch } from "../site/site-context";
import { dataSource, type DataTarget } from "./data-target";
import type { DataChange } from "./rewrite-value";
import type { DataSet } from "./types";

/** Los datos editables del código de un bloque o de una página y cómo cambiarlos. El analizador de TypeScript se carga solo al hacer falta. */
export function useCodeData(target: DataTarget) {
  const site = useSite();
  const dispatch = useSiteDispatch();
  const [sets, setSets] = useState<DataSet[]>([]);
  const { js, save, places } = dataSource(site, target);

  useEffect(() => {
    let current = true;
    if (!js.trim()) return;
    void import("./find-data").then(({ findData }) => current && setSets(findData(js)));
    return () => {
      current = false;
    };
  }, [js]);

  const change = useCallback(
    async (change: DataChange) => {
      const { applyChange } = await import("./rewrite-value");
      const next = applyChange(js, change);
      if (next !== js) dispatch(save(next));
    },
    // `save` se vuelve a crear en cada render; basta con que cambie el código o el destino.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [js, dispatch, target.kind, target.pageId, "blockId" in target ? target.blockId : ""],
  );

  return { sets: js.trim() ? sets : [], change, places };
}
