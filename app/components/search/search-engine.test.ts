import { describe, expect, it } from "vitest";
import { searchMunicipalContent, MUNICIPAL_QUICK_SEARCHES } from "./search-engine";
import type { SiteState } from "../site/types";
import { INITIAL_STATE as INITIAL_TITLE } from "../title-editor/constants";

const makeMockSite = (): SiteState => ({
  pages: [
    {
      id: "inicio",
      name: "Inicio",
      slug: "inicio",
      isHome: true,
      title: { ...INITIAL_TITLE, text: "Bienvenidos al Portal Municipal" },
      media: [],
      blocks: [],
    },
    {
      id: "tramites",
      name: "Trámites",
      slug: "tramites",
      isHome: false,
      title: { ...INITIAL_TITLE, text: "Trámites en Línea" },
      media: [],
      blocks: [],
    },
    {
      id: "servicios",
      name: "Servicios",
      slug: "servicios",
      isHome: false,
      title: { ...INITIAL_TITLE, text: "Servicios Comunales" },
      media: [],
      blocks: [],
    },
    {
      id: "contacto",
      name: "Contacto",
      slug: "contacto",
      isHome: false,
      title: { ...INITIAL_TITLE, text: "Atención y Emergencias" },
      media: [],
      blocks: [],
    },
  ],
  currentPageId: "inicio",
  components: [],
  selectedId: "",
  selectedElementId: null,
} as unknown as SiteState);

describe("search-engine", () => {
  it("devuelve los trámites destacados cuando la consulta está vacía", () => {
    const site = makeMockSite();
    const hits = searchMunicipalContent(site, "");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].category).toBeDefined();
    expect(hits[0].title).toBeDefined();
  });

  it("encuentra resultados para 'permiso de circulación'", () => {
    const site = makeMockSite();
    const hits = searchMunicipalContent(site, "permiso");
    expect(hits.some((h) => h.title.includes("Permiso de Circulación"))).toBe(true);
    expect(hits[0].category).toBe("Trámite");
  });

  it("encuentra farmacia comunal por palabra clave 'salud' o 'remedios'", () => {
    const site = makeMockSite();
    const hits = searchMunicipalContent(site, "remedios");
    expect(hits.some((h) => h.title.includes("Farmacia"))).toBe(true);
    expect(hits.find((h) => h.title.includes("Farmacia"))?.category).toBe("Servicio");
  });

  it("encuentra seguridad por número '1404'", () => {
    const site = makeMockSite();
    const hits = searchMunicipalContent(site, "1404");
    expect(hits.some((h) => h.title.includes("1404"))).toBe(true);
    expect(hits[0].category).toBe("Contacto");
  });

  it("proporciona búsquedas rápidas comunes", () => {
    expect(MUNICIPAL_QUICK_SEARCHES.length).toBeGreaterThanOrEqual(4);
    expect(MUNICIPAL_QUICK_SEARCHES).toContain("Permiso de circulación");
  });
});
