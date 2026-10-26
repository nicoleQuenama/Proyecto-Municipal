import { describe, expect, it } from "vitest";
import { newElement } from "../site/component-templates";
import type { BlockInstance, ComponentDef } from "../site/types";
import { accordionTitle, collapseToTitle } from "./fold-accordion";
import { activeCard, cardPixels, foldOf, isTrimmed } from "./fold-model";

const backdrop = newElement("rect", "fondo", { x: 0, y: 0, width: 300, height: 400 });
const title = newElement("text", "titulo", { x: 20, y: 20, width: 260, height: 30, text: "Preguntas" });
const body = newElement("text", "cuerpo", { x: 20, y: 120, width: 260, height: 200, text: "Respuesta larga" });
const view: ComponentDef = {
  id: "s", name: "FAQ", description: "", category: "sections", width: 300, height: 400, custom: true,
  elements: [backdrop, body, title], links: {},
};

describe("presentaciones para pantallas pequeñas", () => {
  it("el título por defecto es el primer texto en orden de lectura", () => {
    expect(accordionTitle(view)?.id).toBe("titulo");
    expect(accordionTitle(view, "cuerpo")?.id).toBe("cuerpo");
    expect(accordionTitle(view, "borrado")?.id).toBe("titulo");
  });

  it("plegar deja el título, acorta el fondo y quita lo de abajo", () => {
    const folded = collapseToTitle(view);
    expect(folded.elements.map((e) => e.id).sort()).toEqual(["fondo", "titulo"]);
    expect(folded.height).toBe(58);
    expect(folded.elements.find((e) => e.id === "fondo")?.height).toBe(58);
  });

  it("una sección sin textos no se pliega", () => {
    const empty = { ...view, elements: [backdrop] };
    expect(collapseToTitle(empty)).toBe(empty);
  });

  it("recorta solo lo que pasa del límite", () => {
    expect(isTrimmed(500, 320)).toBe(true);
    expect(isTrimmed(300, 320)).toBe(false);
  });

  it("calcula la tarjeta visible del carrusel y su ancho", () => {
    expect(activeCard(0, 300, 5)).toBe(0);
    expect(activeCard(590, 300, 5)).toBe(2);
    expect(activeCard(99999, 300, 5)).toBe(4);
    expect(cardPixels(300, 85)).toBe(255);
  });

  it("la presentación solo vale en tablet y móvil", () => {
    const block: BlockInstance = { id: "b", componentId: "s", fold: { mobile: { kind: "more", maxHeight: 200, moreLabel: "a", lessLabel: "b" } } };
    expect(foldOf(block, "mobile")?.kind).toBe("more");
    expect(foldOf(block, "tablet")).toBeUndefined();
    expect(foldOf(block, "desktop")).toBeUndefined();
  });
});
