import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clampWidth, DEFAULT_WIDTH, MAX_WIDTH, MIN_WIDTH } from "./use-panel-storage";

describe("panel storage rules", () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    globalThis.localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = String(value);
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const key of Object.keys(store)) delete store[key];
      },
      key: (i: number) => Object.keys(store)[i] ?? null,
      length: 0,
    } as Storage;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("restringe el ancho del panel dentro de los límites válidos", () => {
    expect(clampWidth(100)).toBe(MIN_WIDTH);
    expect(clampWidth(1000)).toBe(MAX_WIDTH);
    expect(clampWidth(350)).toBe(350);
    expect(clampWidth(DEFAULT_WIDTH)).toBe(304);
  });

  it("guarda y recupera el estado plegado del panel lateral en localStorage", () => {
    localStorage.setItem("portal.sidepanel.collapsed", "1");
    expect(localStorage.getItem("portal.sidepanel.collapsed")).toBe("1");

    localStorage.setItem("portal.sidepanel.collapsed", "0");
    expect(localStorage.getItem("portal.sidepanel.collapsed")).toBe("0");
  });

  it("guarda y recupera la pestaña activa del panel lateral en localStorage", () => {
    localStorage.setItem("portal.sidepanel.tab", "appearance");
    expect(localStorage.getItem("portal.sidepanel.tab")).toBe("appearance");

    localStorage.setItem("portal.sidepanel.tab", "components");
    expect(localStorage.getItem("portal.sidepanel.tab")).toBe("components");
  });
});
