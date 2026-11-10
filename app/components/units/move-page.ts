import { findMediaUsage } from "../media/media-usage";
import type { SiteAction, SiteState } from "../site/types";

/**
 * Lo que hay que hacer para enviar una página a otra unidad (`null` = global): cambiarle la unidad y, con ella, los archivos
 * de la biblioteca que solo usa esa página y que eran de su misma unidad. Los que usan varias páginas, o son de otra unidad,
 * se quedan donde están (la página guarda su dirección, así que siguen funcionando).
 */
export function pageMoveActions(site: SiteState, pageId: string, unitId: string | null): SiteAction[] {
  const page = site.pages.find((item) => item.id === pageId);
  if (!page || (page.unitId ?? null) === unitId) return [];

  const ownMedia = (site.projectMedia ?? []).filter((asset) => (asset.unitId ?? null) === (page.unitId ?? null) && asset.unitId);
  const onlyHere = ownMedia.filter((asset) => {
    const uses = findMediaUsage(site, asset.src);
    return uses.length > 0 && uses.every((use) => use.pageId === pageId);
  });
  return [
    { type: "page/set-unit", pageId, unitId },
    ...onlyHere.map((asset): SiteAction => ({ type: "project-media/set-unit", id: asset.id, unitId })),
  ];
}
