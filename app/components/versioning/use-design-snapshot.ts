"use client";

import { useMemo } from "react";
import { useExternal } from "../external-site/external-context";
import { useSite } from "../site/site-context";
import { snapshotDesign } from "./design-snapshot";
import type { DesignSnapshot } from "./types";

/** El diseño tal como está ahora mismo: páginas, componentes propios, variables y reglas. */
export function useDesignSnapshot(): DesignSnapshot {
  const { pages, components, variables, rules, navigation } = useSite();
  const { state: external } = useExternal();
  return useMemo(
    () => snapshotDesign({ pages, components, variables, rules, navigation, external }),
    [pages, components, variables, rules, navigation, external],
  );
}
