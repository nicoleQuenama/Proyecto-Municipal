import { describe, expect, it } from "vitest";
import { INITIAL_SITE } from "../site/initial-site";
import { placeBlock } from "./placement-rules";
import { placementStyle } from "./placement-style";
import type { SiteState } from "../site/types";

const withBlock = (): SiteState => ({
  ...INITIAL_SITE,
  pages: [{ ...INITIAL_SITE.pages[0], blocks: [{ id: "b", componentId: "c", placement: { x: 0, y: 0, width: 100 } }] }],
});

const placementOf = (state: SiteState) => state.pages[0].blocks[0].placement;

describe("sección fija en pantalla", () => {
  it("se fija y se suelta pidiéndolo", () => {
    const fixed = placeBlock(withBlock(), "inicio", "b", { x: 0, y: 0, width: 100, fixed: true });
    expect(placementOf(fixed)?.fixed).toBe(true);
    const loose = placeBlock(fixed, "inicio", "b", { x: 0, y: 0, width: 100, fixed: false });
    expect(placementOf(loose)).toEqual({ x: 0, y: 0, width: 100 });
  });

  it("mover o redimensionar no la suelta", () => {
    const fixed = placeBlock(withBlock(), "inicio", "b", { x: 0, y: 0, width: 100, fixed: true });
    const moved = placeBlock(fixed, "inicio", "b", { x: 40, y: 12, width: 100 });
    expect(placementOf(moved)).toEqual({ x: 40, y: 12, width: 100, fixed: true });
  });

  it("el estilo usa position: fixed y queda por encima", () => {
    expect(placementStyle({ x: 1, y: 2, width: 3, fixed: true })).toMatchObject({ position: "fixed", left: 1, top: 2, zIndex: 40 });
    expect(placementStyle({ x: 1, y: 2, width: 3 })?.position).toBe("absolute");
  });
});
