"use client";

import { useMemo } from "react";
import { useSite } from "../site/site-context";
import { snapshotDesign } from "./design-snapshot";
import type { DesignSnapshot } from "./types";

/** El diseño tal como está ahora mismo: páginas, componentes propios, variables y reglas. */
export function useDesignSnapshot(): DesignSnapshot {
  const { pages, components, variables, rules, navigation } = useSite();
  return useMemo(
    () => snapshotDesign({ pages, components, variables, rules, navigation }),
    [pages, components, variables, rules, navigation],
  );
}
