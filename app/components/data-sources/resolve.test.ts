import { describe, expect, it } from "vitest";
import { getPath, toTree } from "./paths";
import { parseBody } from "./parse-body";
import { atIndex, repeatCount, resolveRef } from "./resolve";
import { buildUrl } from "./build-request";
import { freshness } from "./cache-strategies";

const data = { articles: [{ title: "A", tags: ["x"] }, { title: "B" }] };

describe("paths", () => {
  it("lee claves anidadas y posiciones de listas", () => {
    expect(getPath(data, "articles[1].title")).toBe("B");
    expect(getPath(data, "articles[0].tags[0]")).toBe("x");
    expect(getPath(data, "nada.más")).toBeUndefined();
    expect(getPath([5], "[0]")).toBe(5);
  });

  it("arma el árbol con las primeras posiciones de cada lista", () => {
    const tree = toTree(data);
    expect(tree.children[0]).toMatchObject({ key: "articles", isList: true, path: "articles" });
    expect(tree.children[0].children[0].children[0].path).toBe("articles[0].title");
  });
});

describe("repetir secciones", () => {
  const repeat = { sourceId: "s", path: "articles" };

  it("cambia el índice de la clave por el de cada copia", () => {
    expect(atIndex({ sourceId: "s", path: "articles[0].title" }, repeat, 1)).toBe("articles[1].title");
    expect(resolveRef(data, { sourceId: "s", path: "articles[0].title" }, repeat, 1)).toBe("B");
  });

  it("no toca claves de otra fuente o de fuera de la lista", () => {
    expect(atIndex({ sourceId: "otra", path: "articles[0].title" }, repeat, 1)).toBe("articles[0].title");
    expect(atIndex({ sourceId: "s", path: "total" }, repeat, 1)).toBe("total");
  });

  it("cuenta las copias, con tope", () => {
    expect(repeatCount(data, repeat)).toBe(2);
    expect(repeatCount(data, { sourceId: "s", path: "total" })).toBe(0);
    expect(repeatCount(Array.from({ length: 200 }), { sourceId: "s", path: "" })).toBe(50);
  });
});

describe("parseBody", () => {
  it("lee JSON, sea cual sea el tipo declarado", () => {
    expect(parseBody("text/plain", '{"a":1}')).toEqual({ a: 1 });
  });

  it("deja el texto que no entiende como texto", () => {
    expect(parseBody("text/plain", "hola")).toEqual({ texto: "hola" });
    expect(parseBody("application/json", "{roto")).toEqual({ texto: "{roto" });
  });
});

describe("buildUrl y caché", () => {
  it("añade los parámetros y omite los vacíos", () => {
    const url = buildUrl({ url: "https://a.com/n?x=1", query: [{ key: "q", value: "hola mundo" }, { key: " ", value: "z" }] });
    expect(url).toBe("https://a.com/n?x=1&q=hola+mundo");
    expect(buildUrl({ url: "no es url", query: [] })).toBeNull();
  });

  it("cada estrategia decide si lo guardado vale", () => {
    expect(freshness(5_000, { kind: "ttl", seconds: 10 })).toBe("fresh");
    expect(freshness(15_000, { kind: "ttl", seconds: 10 })).toBe("miss");
    expect(freshness(1e9, { kind: "swr", seconds: 0 })).toBe("stale");
    expect(freshness(1e9, { kind: "session", seconds: 0 })).toBe("fresh");
  });
});
