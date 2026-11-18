import { codeOf, sharedDefOf } from "../site/code-source";
import type { SiteAction, SiteState } from "../site/types";
import { usesOf } from "../workbench/block-kind";

/** De dónde sale el código con datos: el de un bloque de código o el de una página. */
export type DataTarget =
  | { kind: "block"; pageId: string; blockId: string }
  | { kind: "page"; pageId: string };

export interface DataSource {
  /** El TypeScript donde se buscan los datos. */
  js: string;
  /** La acción que guarda el código reescrito. */
  save: (js: string) => SiteAction;
  /** En cuántos lugares vale un cambio (más de uno solo en un componente compartido). */
  places: number;
}

type Resolvers = { [K in DataTarget["kind"]]: (site: SiteState, target: Extract<DataTarget, { kind: K }>) => DataSource };

/** Cómo se lee y se guarda el código de cada tipo de destino. Un destino nuevo es una entrada nueva. */
const RESOLVERS: Resolvers = {
  block: (site, { pageId, blockId }) => {
    const block = site.pages.flatMap((p) => p.blocks).find((b) => b.id === blockId);
    // Un componente compartido guarda su código en la definición; el resto, en el propio bloque.
    const shared = block && sharedDefOf(block, site.components);
    return {
      js: (block && codeOf(block, site.components)?.js) ?? "",
      save: (js) =>
        shared
          ? { type: "component/code", componentId: shared.id, patch: { js } }
          : { type: "block/code", pageId, blockId, patch: { js } },
      places: shared ? usesOf(shared.id, site.pages) : 0,
    };
  },

  page: (site, { pageId }) => ({
    js: site.pages.find((p) => p.id === pageId)?.js ?? "",
    save: (js) => ({ type: "page/code", pageId, patch: { js } }),
    places: 0,
  }),
};

export const dataSource = (site: SiteState, target: DataTarget): DataSource =>
  (RESOLVERS[target.kind] as (site: SiteState, target: DataTarget) => DataSource)(site, target);
