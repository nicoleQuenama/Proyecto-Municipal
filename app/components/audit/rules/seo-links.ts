import { defineRule } from "../define-rule";
import { pageElements } from "../page-elements";
import { elementLabel } from "../../navigation/links";

/** Enlaces que no llevan a ninguna parte: página eliminada u oculta, o dirección vacía. */
export const brokenLinks = defineRule({ id: "seo-broken-links", category: "seo", weight: 6, cap: 18, severity: "error" }, (site, page) =>
  pageElements(site, page).flatMap((a) => {
    const link = a.link;
    if (!link) return [];
    const remove = { label: "Quitar el enlace", build: () => [{ type: "link/set" as const, componentId: a.def.id, elementId: a.element.id, link: null }] };
    const target = { blockId: a.block.id, elementId: a.element.id };
    const why = "Un enlace roto frustra a quien lo toca y Google baja la nota de los sitios con enlaces rotos.";

    if (link.kind === "external") {
      return link.url.trim() ? [] : [{ title: `${elementLabel(a.element)}: enlace externo sin dirección`, why, how: "Escribe la dirección o quita el enlace.", target, fixes: [remove] }];
    }
    if (link.kind === "close-modal") return [];
    const destination = site.pages.find((p) => p.id === link.pageId);
    if (!destination) return [{ title: `${elementLabel(a.element)}: lleva a una página que ya no existe`, why, how: "Elige otra página o quita el enlace.", target, fixes: [remove] }];
    return destination.hidden && link.kind === "page"
      ? [{ severity: "warning" as const, title: `${elementLabel(a.element)}: lleva a «${destination.name}», que está oculta`, why, how: "Muestra esa página o cambia el enlace.", target, fixes: [remove] }]
      : [];
  }),
);

/** Imagen para compartir en redes (informativo). */
export const socialImage = defineRule({ id: "seo-social-image", category: "seo", weight: 0, severity: "info" }, (_site, page) =>
  page.seo?.image?.trim()
    ? []
    : [{
        title: "Sin imagen para compartir en redes",
        why: "Cuando alguien comparte la página en WhatsApp o Facebook, la vista previa se ve vacía sin una imagen.",
        how: "Añade una URL de imagen en la pestaña Páginas, bajo «Buscadores». No resta puntos.",
      }],
);
