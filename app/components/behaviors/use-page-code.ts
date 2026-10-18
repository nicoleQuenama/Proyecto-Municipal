"use client";

import { useEffect, useRef } from "react";
import { useOrigin } from "../code/use-origin";
import { functionsFor } from "../functions/scope";
import { useNavigation } from "../navigation/navigation-context";
import { useSite } from "../site/site-context";
import type { Page } from "../site/types";
import { executeCode } from "./execute-code";
import { createApi } from "./page-api";

/** El JavaScript de una página: se ejecuta cuando la página aparece al probar el sitio. `ref` va en el marco de la página. */
export function usePageCode(page: Page, active: boolean) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { pages, libraries, functions } = useSite();
  const { followLink } = useNavigation();
  const origin = useOrigin();
  const source = page.js ?? "";

  useEffect(() => {
    if (!active || !origin || !source.trim()) return;

    const element = ref.current;
    const api = createApi({ element, blockId: "", pages, followLink });
    void executeCode(source, "page", { libraries, origin, api, element, functions: functionsFor(functions, {}) });
    // Solo al aparecer la página o al cambiar su código; las demás dependencias no deben repetirlo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, origin, source, page.id]);

  return ref;
}
