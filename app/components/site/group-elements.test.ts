import { describe, expect, it } from "vitest";
import { groupElements, ungroupElements } from "./group-elements";
import { INITIAL_SITE } from "./initial-site";
import type { CanvasElement, SiteState } from "./types";

const el = (id: string, x: number, y: number, width: number, height: number): CanvasElement =>
  ({ id, kind: "rect", role: "none", x, y, width, height, fill: "#fff" }) as CanvasElement;

const site = (): SiteState => ({
  ...INITIAL_SITE,
  components: [{ id: "c", name: "C", description: "", category: "sections", width: 400, height: 300, custom: true, links: {}, elements: [el("a", 20, 30, 100, 50), el("b", 60, 100, 80, 40), el("z", 300, 10, 10, 10)] }],
});
const elements = (state: SiteState) => state.components[0].elements;

describe("agrupar en tarjeta", () => {
  it("crea un contenedor que abraza a los elegidos y los acopla dentro", () => {
    const next = groupElements(site(), "c", ["a", "b"]);
    const card = elements(next).find((e) => e.id.includes("-tarjeta-"))!;
    expect(card).toMatchObject({ x: 20, y: 30, width: 120, height: 110 });
    expect(elements(next).find((e) => e.id === "a")).toMatchObject({ parentId: card.id, offset: { x: 0, y: 0 } });
    expect(elements(next).find((e) => e.id === "b")).toMatchObject({ parentId: card.id, x: 60, y: 100 });
    expect(elements(next).find((e) => e.id === "z")?.parentId).toBeUndefined();
  });

  it("el contenedor queda detrás de lo que lleva dentro", () => {
    const ids = elements(groupElements(site(), "c", ["a", "b"])).map((e) => e.id);
    expect(ids.indexOf(ids.find((id) => id.includes("-tarjeta-"))!)).toBeLessThan(ids.indexOf("a"));
  });

  it("con menos de dos elementos no hace nada", () => {
    expect(elements(groupElements(site(), "c", ["a"]))).toHaveLength(3);
  });

  it("desagrupar quita el contenedor y deja cada elemento donde se veía", () => {
    const grouped = groupElements(site(), "c", ["a", "b"]);
    const card = elements(grouped).find((e) => e.id.includes("-tarjeta-"))!;
    const back = ungroupElements(grouped, "c", card.id);
    expect(elements(back)).toHaveLength(3);
    expect(elements(back).find((e) => e.id === "b")).toMatchObject({ parentId: undefined, x: 60, y: 100 });
  });
});
