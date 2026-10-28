import { describe, expect, it } from "vitest";
import { INITIAL_SITE } from "./initial-site";
import { moveGroup } from "./group-move";
import type { SiteState } from "./types";

const at = (x: number, y: number) => ({ x, y, width: 100 });
const site = (): SiteState => ({
  ...INITIAL_SITE,
  pages: [{ ...INITIAL_SITE.pages[0], blocks: [
    { id: "a", componentId: "c", placement: at(10, 10) },
    { id: "b", componentId: "c", placement: at(200, 50) },
    { id: "c", componentId: "c", placement: at(0, 0) },
  ] }],
});
const place = (state: SiteState, id: string) => state.pages[0].blocks.find((b) => b.id === id)?.placement;

describe("mover un grupo de secciones", () => {
  it("todas se desplazan lo mismo que la arrastrada y las demás no se tocan", () => {
    const origins = { a: at(10, 10), b: at(200, 50) };
    const next = moveGroup(site(), { pageId: "inicio", anchorId: "a", placement: at(30, 25), origins });
    expect(place(next, "a")).toMatchObject({ x: 30, y: 25 });
    expect(place(next, "b")).toMatchObject({ x: 220, y: 65 });
    expect(place(next, "c")).toMatchObject({ x: 0, y: 0 });
  });

  it("repetir pasos del arrastre no acumula el desplazamiento", () => {
    const origins = { a: at(10, 10), b: at(200, 50) };
    let state = moveGroup(site(), { pageId: "inicio", anchorId: "a", placement: at(20, 20), origins });
    state = moveGroup(state, { pageId: "inicio", anchorId: "a", placement: at(30, 25), origins });
    expect(place(state, "b")).toMatchObject({ x: 220, y: 65 });
  });
});
