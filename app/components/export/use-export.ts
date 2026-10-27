"use client";

import { useMemo } from "react";
import { applyOverrides } from "../site/overrides";
import { useSite } from "../site/site-context";
import type { BlockInstance, ComponentDef } from "../site/types";
import { useStyles } from "../styles/use-styles";
import { externalizeAssets, type ExportAsset } from "./assets";
import { buildReference } from "./reference";
import { buildSpec } from "./spec";

export interface DesignExport {
  spec: string;
  reference: { html: string; css: string };
  assets: ExportAsset[];
}

/** Todo lo que sale de una sección: su especificación, su código de referencia y sus imágenes subidas. */
export function useDesignExport(pageId: string, block: BlockInstance, def: ComponentDef): DesignExport {
  const site = useSite();
  const styles = useStyles(pageId);

  return useMemo(() => {
    const view = applyOverrides(styles.component(def), block, styles.resolver(def.id));
    const { view: clean, assets } = externalizeAssets(view);
    const page = site.pages.find((p) => p.id === pageId);
    const sourceName = (id: string) => site.sources.find((s) => s.id === id)?.name ?? "API";

    const spec = buildSpec({
      view: clean,
      block,
      pageName: page?.name ?? "",
      route: page?.route,
      variables: site.variables,
      context: {
        pageName: (id) => site.pages.find((p) => p.id === id)?.name ?? id,
        sourceName,
        sourcePath: (id, path) => `«${sourceName(id)}» › ${path}`,
      },
    });
    return { spec, reference: buildReference(clean), assets };
  }, [styles, def, block, site.pages, site.sources, site.variables, pageId]);
}
