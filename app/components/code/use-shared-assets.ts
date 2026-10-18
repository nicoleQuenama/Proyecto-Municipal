"use client";

import { useMemo } from "react";
import { functionsFor } from "../functions/scope";
import { useSite } from "../site/site-context";
import type { SharedAssets } from "./build-srcdoc";

/** Lo del proyecto que el código de un bloque también usa; se conserva igual mientras nada cambie. */
export function useSharedAssets(blockId: string): SharedAssets {
  const { variables, globalCss, functions } = useSite();
  return useMemo(
    () => ({ variables, globalCss, functions: functionsFor(functions, { blockId }) }),
    [variables, globalCss, functions, blockId],
  );
}
