import { INITIAL_SITE } from "../site/initial-site";
import type { CanvasElement, ComponentDef, SiteState } from "../site/types";

/** Ayudas para las pruebas: un sitio con una sola sección y los elementos que se pidan. */
export const el = (patch: Partial<CanvasElement> & { id: string }): CanvasElement => ({
  kind: "text", role: "none", x: 0, y: 0, width: 200, height: 60, fill: "#ffffff", radius: 0,
  text: "", fontSize: 16, color: "#000000", bold: false, align: "left", fontFamily: "", src: "", ...patch,
});

export function siteWith(elements: CanvasElement[], links: ComponentDef["links"] = {}): SiteState {
  const def: ComponentDef = { id: "c1", name: "Prueba", description: "", category: "sections", width: 800, height: 400, elements, links, custom: true };
  const home = INITIAL_SITE.pages[0];
  return {
    ...INITIAL_SITE,
    components: [def],
    pages: [{ ...home, blocks: [{ id: "b1", componentId: "c1" }] }, ...INITIAL_SITE.pages.slice(1)],
  };
}

/** Cambia el tipo de titular de la página de inicio. */
export function withTitleBlock(site: SiteState, block: "h1" | "h2" | "h3" | "p"): SiteState {
  const [home, ...rest] = site.pages;
  return { ...site, pages: [{ ...home, title: { ...home.title, block } }, ...rest] };
}
