import { describe, expect, it } from "vitest";
import { expandTokens, usesServerPaging } from "./url-tokens";
import { buildUrl } from "./build-request";
import { clampSize, pageButtons, pageCount, pagerModel, pagingParams, serverParams, windowOf } from "./paging";

describe("pageButtons", () => {
  it("muestra todo si hay pocas páginas", () => {
    expect(pageButtons(1, 3)).toEqual([1, 2, 3]);
  });
  it("pone puntos suspensivos en los huecos", () => {
    expect(pageButtons(1, 20)).toEqual([1, 2, "…", 20]);
    expect(pageButtons(10, 20)).toEqual([1, "…", 9, 10, 11, "…", 20]);
    expect(pageButtons(20, 20)).toEqual([1, "…", 19, 20]);
  });
  it("no pone puntos para un hueco de una sola página", () => {
    expect(pageButtons(4, 8)).toEqual([1, 2, 3, 4, 5, "…", 8]);
  });
});

describe("conteos y rangos", () => {
  it("cuenta páginas", () => {
    expect(pageCount(24, 8)).toBe(3);
    expect(pageCount(25, 8)).toBe(4);
    expect(pageCount(0, 8)).toBe(1);
  });
  it("recorta la lista por página", () => {
    expect(windowOf(24, { page: 1, size: 8 })).toEqual({ start: 0, count: 8 });
    expect(windowOf(24, { page: 3, size: 8 })).toEqual({ start: 16, count: 8 });
    expect(windowOf(20, { page: 3, size: 8 })).toEqual({ start: 16, count: 4 });
  });
  it("si la página se pasa, usa la última; una lista vacía no da copias", () => {
    expect(windowOf(20, { page: 9, size: 8 })).toEqual({ start: 16, count: 4 });
    expect(windowOf(0, { page: 1, size: 8 })).toEqual({ start: 0, count: 0 });
  });
  it("calcula offset y limit", () => {
    expect(serverParams({ page: 3, size: 20 })).toEqual({ page: 3, offset: 40, limit: 20 });
  });
  it("limita el tamaño de página", () => {
    expect(clampSize(0)).toBe(1);
    expect(clampSize(500)).toBe(50);
  });
});

describe("pagerModel", () => {
  it("con total conocido", () => {
    const model = pagerModel(2, 8, 24, 8);
    expect(model).toMatchObject({ page: 2, hasPrev: true, hasNext: true });
    expect(pagerModel(3, 8, 24, 8).hasNext).toBe(false);
  });
  it("sin total, hay más mientras la página llegue llena", () => {
    expect(pagerModel(1, 8, null, 8)).toMatchObject({ buttons: [], hasPrev: false, hasNext: true });
    expect(pagerModel(2, 8, null, 3)).toMatchObject({ hasPrev: true, hasNext: false });
  });
});

describe("claves de paginación en la URL", () => {
  const params = pagingParams({ page: 3, size: 20 });
  it("se resuelven con la página de la sección", () => {
    expect(expandTokens("https://x.com/p?offset={offset}&limit={limit}&page={page}", new Date(), params)).toBe(
      "https://x.com/p?offset=40&limit=20&page=3",
    );
  });
  it("la URL cambia con la página (la caché distingue por URL)", () => {
    const source = { url: "https://x.com/p", query: [{ key: "offset", value: "{offset}" }] };
    expect(buildUrl(source, new Date(), params)).toContain("offset=40");
    expect(buildUrl(source, new Date(), pagingParams({ page: 1, size: 20 }))).toContain("offset=0");
  });
  it("sin paginación pide la primera página", () => {
    expect(expandTokens("{page}-{offset}")).toBe("1-0");
  });
  it("detecta si la URL pide la página al servidor", () => {
    expect(usesServerPaging("https://x.com/p?offset={offset}")).toBe(true);
    expect(usesServerPaging("https://x.com/p")).toBe(false);
  });
});
