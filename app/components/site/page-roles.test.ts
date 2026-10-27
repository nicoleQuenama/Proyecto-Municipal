import { describe, expect, it } from "vitest";
import { INITIAL_SITE } from "./initial-site";
import { loadingSeconds, pageWithRole, setPageRole } from "./page-roles";
import { siteReducer } from "./site-reducer";
import type { Page, SiteState } from "./types";

const withPages = (): SiteState => {
  const base = siteReducer(INITIAL_SITE, { type: "page/create", id: "carga", name: "Carga" });
  return siteReducer(base, { type: "page/create", id: "error", name: "Error" });
};

describe("funciones de página", () => {
  it("una página toma la función y se encuentra", () => {
    const state = setPageRole(withPages(), "carga", "loading");
    expect(pageWithRole(state.pages, "loading")?.id).toBe("carga");
    expect(pageWithRole(state.pages, "not-found")).toBeUndefined();
  });

  it("solo hay una página por función: la anterior vuelve a ser normal", () => {
    const first = setPageRole(withPages(), "carga", "not-found");
    const second = setPageRole(first, "error", "not-found");
    expect(pageWithRole(second.pages, "not-found")?.id).toBe("error");
    expect(second.pages.find((p) => p.id === "carga")?.role).toBeUndefined();
  });

  it("se quita con null y la de inicio no puede tener función", () => {
    const set = setPageRole(withPages(), "carga", "loading");
    expect(pageWithRole(setPageRole(set, "carga", null).pages, "loading")).toBeUndefined();
    expect(setPageRole(set, "inicio", "loading")).toBe(set);
  });

  it("llega por el reductor", () => {
    const state = siteReducer(withPages(), { type: "page/role", id: "carga", role: "loading" });
    expect(state.pages.find((p) => p.id === "carga")?.role).toBe("loading");
  });
});

describe("loadingSeconds", () => {
  const page = (behaviors: { delay?: number; seconds?: number }[]): Page => ({
    ...INITIAL_SITE.pages[0],
    blocks: [
      {
        id: "b",
        componentId: "c",
        behaviors: behaviors.map((b, i) => ({
          id: String(i),
          scope: "section",
          trigger: "load" as const,
          delay: b.delay,
          action: { kind: "animate" as const, effect: "fade" as const, seconds: b.seconds ?? 0.5 },
        })),
      },
    ],
  });

  it("dura hasta la última animación", () => {
    expect(loadingSeconds(page([{ seconds: 2 }, { delay: 2.3, seconds: 0.5 }]))).toBeCloseTo(2.8);
  });

  it("sin animaciones dura un tiempo corto por defecto", () => {
    expect(loadingSeconds({ ...INITIAL_SITE.pages[0], blocks: [] })).toBe(1.5);
  });

  it("nunca dura menos del mínimo", () => {
    expect(loadingSeconds(page([{ seconds: 0.1 }]))).toBe(0.8);
  });
});
