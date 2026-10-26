import { describe, expect, it } from "vitest";
import { buildUrl, requestKey } from "./build-request";
import { expandTokens } from "./url-tokens";

const NEW_YEAR = new Date(2026, 0, 1);
const LAST_DAY = new Date(2026, 11, 31);

describe("expandTokens", () => {
  it("el día del año empieza en 1", () => {
    expect(expandTokens("/p/{dayOfYear}", NEW_YEAR)).toBe("/p/1");
    expect(expandTokens("/p/{dayOfYear}", LAST_DAY)).toBe("/p/365");
  });

  it("con un máximo da la vuelta", () => {
    expect(expandTokens("{dayOfYear:100}", LAST_DAY)).toBe("65");
  });

  it("escribe la fecha de hoy", () => {
    expect(expandTokens("{today}", new Date(2026, 9, 3))).toBe("2026-10-03");
  });

  it("el azar queda dentro del rango y se mantiene", () => {
    const first = expandTokens("{random:5-9}");
    expect(Number(first)).toBeGreaterThanOrEqual(5);
    expect(Number(first)).toBeLessThanOrEqual(9);
    expect(expandTokens("{random:5-9}")).toBe(first);
  });

  it("deja las claves desconocidas como estaban", () => {
    expect(expandTokens("{otra}", NEW_YEAR)).toBe("{otra}");
  });
});

describe("buildUrl", () => {
  it("cambia las claves en la ruta y en los parámetros", () => {
    const url = buildUrl({ url: "https://x.com/a/{dayOfYear}", query: [{ key: "d", value: "{today}" }] }, NEW_YEAR);
    expect(url).toBe("https://x.com/a/1?d=2026-01-01");
  });
});

describe("parámetros de la página ({param:x})", () => {
  it("escribe el parámetro en la URL", () => {
    expect(expandTokens("/pokemon/{param:id}", NEW_YEAR, { id: "25" })).toBe("/pokemon/25");
  });

  it("sin valor deja la clave como estaba", () => {
    expect(expandTokens("{param:id}", NEW_YEAR)).toBe("{param:id}");
  });

  it("buildUrl codifica el valor en la ruta y en la query", () => {
    const source = { url: "https://x.com/p/{param:slug}", query: [{ key: "q", value: "{param:slug}" }] };
    expect(buildUrl(source, NEW_YEAR, { slug: "a b" })).toBe("https://x.com/p/a%20b?q=a+b");
  });

  it("buildUrl no resuelve una URL a medias", () => {
    expect(buildUrl({ url: "https://x.com/p/{param:id}", query: [] }, NEW_YEAR, {})).toBeNull();
  });

  it("cada valor da una clave de caché distinta", () => {
    const source = { id: "a", name: "A", url: "https://x.com/p/{param:id}", method: "GET" as const, query: [], headers: [], transform: "", cache: { kind: "swr" as const, seconds: 0 } };
    expect(requestKey(source, { id: "1" })).not.toBe(requestKey(source, { id: "2" }));
  });
});
