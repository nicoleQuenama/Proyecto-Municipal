import { describe, expect, it } from "vitest";
import { siteReducer } from "./site-reducer";
import { applyOverrides } from "./overrides";
import { INITIAL_SITE } from "./initial-site";
import type { ComponentDef, SiteState } from "./types";

describe("independencia de medios y estilos entre bloques que reusan el mismo componente", () => {
  const novedadesDef: ComponentDef = {
    id: "comp-novedades",
    name: "Novedades Municipales",
    description: "Tarjetas de noticias y novedades",
    category: "cards",
    width: 960,
    height: 320,
    elements: [
      {
        id: "card-1-rect",
        kind: "rect",
        x: 0,
        y: 0,
        width: 300,
        height: 320,
        fill: "#ffffff",
        radius: 8,
        role: "none",
        text: "",
        fontSize: 16,
        color: "#000",
        bold: false,
        align: "left",
        fontFamily: "",
        src: "",
      },
      {
        id: "card-1-img",
        kind: "image",
        x: 0,
        y: 0,
        width: 300,
        height: 180,
        fill: "transparent",
        radius: 8,
        role: "image",
        text: "",
        fontSize: 16,
        color: "#000",
        bold: false,
        align: "left",
        fontFamily: "",
        src: "https://ejemplo.com/default.jpg",
      },
    ],
    links: {},
    custom: false,
  };

  const initialState: SiteState = {
    ...INITIAL_SITE,
    currentPageId: "inicio",
    selectedId: "block-novedades-inicio",
    selectedElementId: null,
    components: [novedadesDef],
    pages: [
      {
        ...INITIAL_SITE.pages[0],
        id: "inicio",
        name: "Inicio",
        slug: "inicio",
        isHome: true,
        media: [],
        blocks: [
          {
            id: "block-novedades-inicio",
            componentId: "comp-novedades",
          },
        ],
      },
      {
        ...INITIAL_SITE.pages[0],
        id: "prensa",
        name: "Prensa",
        slug: "prensa",
        isHome: false,
        media: [],
        blocks: [
          {
            id: "block-novedades-prensa",
            componentId: "comp-novedades",
          },
        ],
      },
    ],
  };

  it("actualizar imagen con block/style cambia solo el bloque de esa pagina sin alterar los demas bloques ni la definicion", () => {
    const updated = siteReducer(initialState, {
      type: "block/style",
      pageId: "inicio",
      blockId: "block-novedades-inicio",
      elementIds: ["card-1-img"],
      patch: { src: "https://ejemplo.com/foto-puentes-inicio.jpg" },
    });

    const blockInicio = updated.pages.find((p) => p.id === "inicio")!.blocks[0];
    const blockPrensa = updated.pages.find((p) => p.id === "prensa")!.blocks[0];

    // El bloque de Inicio tiene su propia foto asignada en elements
    expect(blockInicio.elements?.["card-1-img"]?.src).toBe(
      "https://ejemplo.com/foto-puentes-inicio.jpg"
    );

    // El bloque de Prensa NO tiene esa foto asignada y mantiene su independencia
    expect(blockPrensa.elements?.["card-1-img"]).toBeUndefined();

    // La definicion global del componente NO fue alterada
    const compGlobal = updated.components.find((c) => c.id === "comp-novedades")!;
    const imgGlobal = compGlobal.elements.find((e) => e.id === "card-1-img")!;
    expect(imgGlobal.src).toBe("https://ejemplo.com/default.jpg");

    // Al aplicar overrides, cada bloque se renderiza con su foto individual
    const renderedInicio = applyOverrides(compGlobal, blockInicio, () => undefined);
    const renderedPrensa = applyOverrides(compGlobal, blockPrensa, () => undefined);

    const inicioImg = renderedInicio.elements.find((e) => e.id === "card-1-img")!;
    const prensaImg = renderedPrensa.elements.find((e) => e.id === "card-1-img")!;

    expect(inicioImg.src).toBe("https://ejemplo.com/foto-puentes-inicio.jpg");
    expect(prensaImg.src).toBe("https://ejemplo.com/default.jpg");
  });

  it("dos bloques que reusan el mismo componente pueden tener fotos distintas simultaneamente", () => {
    let state = siteReducer(initialState, {
      type: "block/style",
      pageId: "inicio",
      blockId: "block-novedades-inicio",
      elementIds: ["card-1-img"],
      patch: { src: "https://ejemplo.com/obra-inicio.jpg" },
    });

    state = siteReducer(state, {
      type: "block/style",
      pageId: "prensa",
      blockId: "block-novedades-prensa",
      elementIds: ["card-1-img"],
      patch: { src: "https://ejemplo.com/noticia-prensa.jpg" },
    });

    const blockInicio = state.pages.find((p) => p.id === "inicio")!.blocks[0];
    const blockPrensa = state.pages.find((p) => p.id === "prensa")!.blocks[0];
    const comp = state.components.find((c) => c.id === "comp-novedades")!;

    const renderedInicio = applyOverrides(comp, blockInicio, () => undefined);
    const renderedPrensa = applyOverrides(comp, blockPrensa, () => undefined);

    expect(renderedInicio.elements.find((e) => e.id === "card-1-img")!.src).toBe(
      "https://ejemplo.com/obra-inicio.jpg"
    );
    expect(renderedPrensa.elements.find((e) => e.id === "card-1-img")!.src).toBe(
      "https://ejemplo.com/noticia-prensa.jpg"
    );
  });
});
