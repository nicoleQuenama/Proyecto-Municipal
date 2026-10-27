import { describe, expect, it } from "vitest";
import { inferredParams, resolveLinkParams, resolveParam } from "./link-values";

const data = { items: [{ id: 25, name: "Pikachu" }, { id: 4, name: "Charmander" }] };
const read = (sourceId: string) => (sourceId === "api" ? data : undefined);
const repeat = { sourceId: "api", path: "items" };

describe("resolveParam", () => {
  it("un texto escrito vale tal cual", () => {
    expect(resolveParam(" 7 ", read, undefined, null)).toBe("7");
  });

  it("una clave lee el dato", () => {
    expect(resolveParam({ sourceId: "api", path: "items[0].id" }, read, undefined, null)).toBe("25");
  });

  it("en una sección repetida usa el índice de la copia", () => {
    const ref = { sourceId: "api", path: "items[0].id" };
    expect(resolveParam(ref, read, repeat, 1)).toBe("4");
  });

  it("sin datos o con un objeto queda vacío", () => {
    expect(resolveParam({ sourceId: "otra", path: "x" }, read, undefined, null)).toBe("");
    expect(resolveParam({ sourceId: "api", path: "items[0]" }, read, undefined, null)).toBe("");
  });
});

describe("inferredParams", () => {
  it("en una sección repetida, cada parámetro sin valor toma la clave del mismo nombre", () => {
    const spec = inferredParams(["id"], undefined, repeat);
    expect(resolveLinkParams(spec, read, repeat, 1)).toEqual({ id: "4" });
  });

  it("respeta lo que ya se configuró y no hace nada fuera de una lista", () => {
    expect(inferredParams(["id"], { id: "7" }, repeat)).toEqual({});
    expect(inferredParams(["id"], undefined, undefined)).toEqual({});
  });
});

describe("resolveLinkParams", () => {
  it("junta los resueltos y omite los vacíos", () => {
    const spec = { id: { sourceId: "api", path: "items[0].id" }, slug: "", extra: "x" };
    expect(resolveLinkParams(spec, read, repeat, 1)).toEqual({ id: "4", extra: "x" });
  });

  it("sin configuración no hay parámetros", () => {
    expect(resolveLinkParams(undefined, read, undefined, null)).toEqual({});
  });
});
