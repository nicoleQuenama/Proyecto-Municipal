import { describe, expect, it } from "vitest";
import { ZOOM_STEPS } from "./viewport-context";
import { fitZoom } from "./fit-zoom";
import { siteReducer } from "../site/site-reducer";
import { INITIAL_SITE } from "../site/initial-site";
import { IMAGE_BLOCK_COMPONENT_ID } from "../site/component-templates";

describe("zoom out y componente de bloque de imagen", () => {
  it("ZOOM_STEPS incluye el paso de zoom out al 5% para permitir alejar ampliamente el lienzo", () => {
    expect(ZOOM_STEPS[0]).toBe(5);
    expect(ZOOM_STEPS).toContain(5);
    expect(ZOOM_STEPS).toContain(10);
  });

  it("fitZoom puede llegar hasta el minimo de zoom si hay muchas paginas", () => {
    // 20 paginas de 1024px en un viewport de 1200px
    const zoom = fitZoom(20, 1024, 1200, ZOOM_STEPS);
    expect(zoom).toBe(5);
  });

  it("block/add resuelve automaticamente IMAGE_BLOCK_COMPONENT aunque no este en components", () => {
    const s = siteReducer(INITIAL_SITE, {
      type: "block/add",
      id: "test-img-block",
      componentId: IMAGE_BLOCK_COMPONENT_ID,
      pageId: "inicio",
    });

    const page = s.pages.find((p) => p.id === "inicio");
    expect(page?.blocks).toHaveLength(1);
    expect(page?.blocks[0].componentId).toBe(IMAGE_BLOCK_COMPONENT_ID);
    expect(s.components.some((c) => c.id === IMAGE_BLOCK_COMPONENT_ID)).toBe(true);

    // Permite aplicar estilo individual al bloque
    const updated = siteReducer(s, {
      type: "block/style",
      pageId: "inicio",
      blockId: "test-img-block",
      elementIds: ["image-content"],
      patch: { src: "https://ejemplo.com/plaza.jpg", alt: "Plaza Central" },
    });

    const block = updated.pages[0].blocks[0];
    expect(block.elements?.["image-content"]).toMatchObject({
      src: "https://ejemplo.com/plaza.jpg",
      alt: "Plaza Central",
    });
  });
});
