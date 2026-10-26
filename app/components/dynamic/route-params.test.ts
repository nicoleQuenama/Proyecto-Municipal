import { describe, expect, it } from "vitest";
import { effectiveParams, fillRoute, normalizeRoute, paramsOf } from "./route-params";

describe("paramsOf", () => {
  it("saca los parámetros en orden y sin repetir", () => {
    expect(paramsOf("/pokemon/:id")).toEqual(["id"]);
    expect(paramsOf("/blog/:categoria/:slug/:slug")).toEqual(["categoria", "slug"]);
  });

  it("una ruta fija no tiene parámetros", () => {
    expect(paramsOf("/contacto")).toEqual([]);
    expect(paramsOf(undefined)).toEqual([]);
  });
});

describe("normalizeRoute", () => {
  it("añade la barra y limpia espacios", () => {
    expect(normalizeRoute(" pokemon/:id/ ")).toBe("/pokemon/:id");
  });

  it("sin parámetros no es dinámica", () => {
    expect(normalizeRoute("/pokemon")).toBeNull();
  });
});

describe("fillRoute", () => {
  it("escribe los valores y deja los que faltan", () => {
    expect(fillRoute("/pokemon/:id", { id: "25" })).toBe("/pokemon/25");
    expect(fillRoute("/a/:x/:y", { x: "1" })).toBe("/a/1/:y");
  });

  it("codifica el valor", () => {
    expect(fillRoute("/blog/:slug", { slug: "a b" })).toBe("/blog/a%20b");
  });
});

describe("effectiveParams", () => {
  it("prefiere lo recibido y cae en el ejemplo", () => {
    expect(effectiveParams("/p/:id/:n", { id: "1", n: "x" }, { id: "9" })).toEqual({ id: "9", n: "x" });
  });

  it("ignora lo que no es parámetro de la ruta", () => {
    expect(effectiveParams("/p/:id", undefined, { otro: "1" })).toEqual({ id: "" });
  });
});
