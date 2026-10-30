import { describe, expect, it } from "vitest";
import { getBlockSlot, splitBlocks } from "./rules";
import { siteReducer } from "./site-reducer";
import { INITIAL_SITE } from "./initial-site";
import { INITIAL_STATE as INITIAL_TITLE } from "../title-editor/constants";
import type { BlockInstance, ComponentDef, Page, SiteState } from "./types";

const makeComp = (id: string, name: string, category: string): ComponentDef => ({
  id,
  name,
  description: "",
  category: category as any,
  width: 1024,
  height: 200,
  elements: [],
  links: {},
  custom: true,
});

const makeBlock = (id: string, componentId: string, slot?: "header" | "body" | "footer", scope?: "page" | "global"): BlockInstance => ({
  id,
  componentId,
  slot,
  scope,
});

describe("getBlockSlot", () => {
  const navComp = makeComp("nav1", "Barra de navegación", "navigation");
  const footerComp = makeComp("foot1", "Pie de página institucional", "navigation");
  const cardsComp = makeComp("cards1", "Tarjetas de servicios", "sections");

  it("prioritizes explicit block.slot if set", () => {
    expect(getBlockSlot(makeBlock("b1", "cards1", "footer"), cardsComp)).toBe("footer");
    expect(getBlockSlot(makeBlock("b2", "nav1", "body"), navComp)).toBe("body");
    expect(getBlockSlot(makeBlock("b3", "foot1", "header"), footerComp)).toBe("header");
  });

  it("detects footer from component name or id if category is navigation", () => {
    expect(getBlockSlot(makeBlock("b1", "foot1"), footerComp)).toBe("footer");
  });

  it("detects header for navigation components that are not footers", () => {
    expect(getBlockSlot(makeBlock("b1", "nav1"), navComp)).toBe("header");
  });

  it("defaults to body for non-navigation components without explicit slot", () => {
    expect(getBlockSlot(makeBlock("b1", "cards1"), cardsComp)).toBe("body");
  });
});

describe("splitBlocks", () => {
  const navComp = makeComp("nav", "Navbar", "navigation");
  const heroComp = makeComp("hero", "Hero Banner", "sections");
  const footerComp = makeComp("footer", "Footer", "navigation");
  const comps = [navComp, heroComp, footerComp];

  const homePage: Page = {
    id: "p-home",
    name: "Inicio",
    slug: "inicio",
    isHome: true,
    title: { ...INITIAL_TITLE, text: "Bienvenido" },
    media: [],
    blocks: [
      makeBlock("b-nav", "nav", "header", "global"),
      makeBlock("b-hero", "hero", "body"),
      makeBlock("b-foot", "footer", "footer", "global"),
    ],
  };

  const contactPage: Page = {
    id: "p-contact",
    name: "Contacto",
    slug: "contacto",
    isHome: false,
    title: { ...INITIAL_TITLE, text: "Contacto" },
    media: [],
    blocks: [
      makeBlock("b-contact-form", "hero", "body"),
    ],
  };

  it("splits blocks into top (header), body, and bottom (footer)", () => {
    const { top, body, bottom } = splitBlocks(homePage, comps);
    expect(top.map((b) => b.id)).toEqual(["b-nav"]);
    expect(body.map((b) => b.id)).toEqual(["b-hero"]);
    expect(bottom.map((b) => b.id)).toEqual(["b-foot"]);
  });

  it("inherits global header and footer on subpages without local ones", () => {
    const { top, body, bottom } = splitBlocks(contactPage, comps, [homePage, contactPage]);
    expect(top.map((b) => b.id)).toEqual(["b-nav"]);
    expect(body.map((b) => b.id)).toEqual(["b-contact-form"]);
    expect(bottom.map((b) => b.id)).toEqual(["b-foot"]);
  });

  it("allows page to have its own custom footer overriding the global one", () => {
    const customFooterPage: Page = {
      ...contactPage,
      blocks: [
        makeBlock("b-contact-form", "hero", "body"),
        makeBlock("b-custom-foot", "footer", "footer", "page"),
      ],
    };
    const { top, body, bottom } = splitBlocks(customFooterPage, comps, [homePage, customFooterPage]);
    expect(top.map((b) => b.id)).toEqual(["b-nav"]);
    expect(bottom.map((b) => b.id)).toEqual(["b-custom-foot"]);
  });

  it("hides header when hideHeader is true", () => {
    const landingPage: Page = {
      ...homePage,
      hideHeader: true,
    };
    const { top, body, bottom } = splitBlocks(landingPage, comps, [homePage, landingPage]);
    expect(top).toHaveLength(0);
    expect(body).toHaveLength(1);
    expect(bottom).toHaveLength(1);
  });

  it("hides footer when hideFooter is true", () => {
    const noFooterPage: Page = {
      ...contactPage,
      hideFooter: true,
    };
    const { top, body, bottom } = splitBlocks(noFooterPage, comps, [homePage, noFooterPage]);
    expect(top).toHaveLength(1);
    expect(bottom).toHaveLength(0);
  });
});

describe("reducer layout actions", () => {
  const baseState = (): SiteState => ({
    ...INITIAL_SITE,
    pages: [
      {
        id: "p1",
        name: "Inicio",
        slug: "inicio",
        isHome: true,
        title: { ...INITIAL_TITLE, text: "Titular" },
        media: [],
        blocks: [{ id: "b1", componentId: "c1" }],
      },
    ],
    components: [makeComp("c1", "Sección", "sections")],
  });

  it("sets block slot to header, body, or footer", () => {
    let s = baseState();
    s = siteReducer(s, { type: "block/slot", pageId: "p1", blockId: "b1", slot: "footer" });
    expect(s.pages[0].blocks[0].slot).toBe("footer");

    s = siteReducer(s, { type: "block/slot", pageId: "p1", blockId: "b1", slot: "header" });
    expect(s.pages[0].blocks[0].slot).toBe("header");
  });

  it("sets block scope to global or page", () => {
    let s = baseState();
    s = siteReducer(s, { type: "block/scope", pageId: "p1", blockId: "b1", scope: "global" });
    expect(s.pages[0].blocks[0].scope).toBe("global");

    s = siteReducer(s, { type: "block/scope", pageId: "p1", blockId: "b1", scope: "page" });
    expect(s.pages[0].blocks[0].scope).toBe("page");
  });

  it("toggles page hideHeader and hideFooter", () => {
    let s = baseState();
    s = siteReducer(s, { type: "page/layout-toggles", pageId: "p1", patch: { hideHeader: true, hideFooter: true } });
    expect(s.pages[0].hideHeader).toBe(true);
    expect(s.pages[0].hideFooter).toBe(true);

    s = siteReducer(s, { type: "page/layout-toggles", pageId: "p1", patch: { hideHeader: false } });
    expect(s.pages[0].hideHeader).toBe(false);
    expect(s.pages[0].hideFooter).toBe(true);
  });

  it("sets block placementMode and clears placement when switched to flow", () => {
    let s = baseState();
    s = siteReducer(s, { type: "block/place", pageId: "p1", blockId: "b1", placement: { x: 100, y: 200, width: 300 } });
    expect(s.pages[0].blocks[0].placement).toEqual({ x: 100, y: 200, width: 300 });

    s = siteReducer(s, { type: "block/placement-mode", pageId: "p1", blockId: "b1", mode: "overlay" });
    expect(s.pages[0].blocks[0].placementMode).toBe("overlay");
    expect(s.pages[0].blocks[0].placement).toEqual({ x: 100, y: 200, width: 300 });

    s = siteReducer(s, { type: "block/placement-mode", pageId: "p1", blockId: "b1", mode: "flow" });
    expect(s.pages[0].blocks[0].placementMode).toBe("flow");
    expect(s.pages[0].blocks[0].placement).toBeUndefined();
  });
});
