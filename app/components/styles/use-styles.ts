"use client";

import { useMemo } from "react";
import { useCurrentPage, useSite } from "../site/site-context";
import type { ComponentDef } from "../site/types";
import { styleComponent } from "./apply";
import { computeStyle, resolveValue } from "./resolve";
import type { ElementRole, StyleContext, StyleState } from "./types";
import { styleTarget } from "../site/categories";

/**
 * Los estilos que valen en una página, listos para aplicarlos al dibujar.
 * Sin argumentos son los de la página actual; con un id, los de esa página (para verlas lado a lado).
 */
export function useStyles(forPageId?: string) {
  const { variables, rules } = useSite();
  const currentId = useCurrentPage().id;
  const pageId = forPageId ?? currentId;

  return useMemo(() => {
    const styles: StyleState = { variables, rules };
    const pageCtx: StyleContext = { pageId };

    return {
      /** Reglas de la página (relleno, margen, fondo, espacio entre bloques…). */
      page: computeStyle(styles, pageCtx, "page"),
      /** Reglas de un tipo de elemento («todos los botones», «todos los títulos»…). */
      role: (role: ElementRole) => computeStyle(styles, pageCtx, role),
      /** Reglas de la caja de un componente, según su categoría y su propio ámbito. */
      block: (def: ComponentDef) =>
        computeStyle(styles, { pageId, componentId: def.id }, styleTarget(def.category)),
      /** El componente con las reglas de cada rol aplicadas a sus elementos. */
      component: (def: ComponentDef) => styleComponent(def, styles, pageId),
      /** Sustituye `var(--nombre)` por el valor de la variable que vale en esta página y componente. */
      resolver: (componentId?: string) => (value: string) =>
        resolveValue(value, variables, { pageId, componentId }),
    };
  }, [variables, rules, pageId]);
}
