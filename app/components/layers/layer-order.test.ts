import { describe, expect, it } from "vitest";
import { canStep, dropLayer, frontToBack, sortByOrder, stepLayer } from "./layer-order";

const ids = ["fondo", "foto", "titulo", "boton"]; // de atrás hacia delante

describe("frontToBack", () => {
  it("invierte sin tocar el original", () => {
    expect(frontToBack(ids)).toEqual(["boton", "titulo", "foto", "fondo"]);
    expect(ids[0]).toBe("fondo");
  });
});

describe("stepLayer", () => {
  it("sube una capa un lugar (hacia delante)", () => {
    expect(stepLayer(ids, "foto", "forward")).toEqual(["fondo", "titulo", "foto", "boton"]);
  });

  it("baja una capa un lugar (hacia atrás)", () => {
    expect(stepLayer(ids, "titulo", "backward")).toEqual(["fondo", "titulo", "foto", "boton"]);
  });

  it("no pasa de los extremos", () => {
    expect(canStep(ids, "boton", "forward")).toBe(false);
    expect(canStep(ids, "fondo", "backward")).toBe(false);
    expect(stepLayer(ids, "boton", "forward")).toEqual(ids);
  });
});

describe("dropLayer", () => {
  it("encima de otra capa = justo delante de ella", () => {
    expect(dropLayer(ids, "fondo", "titulo", "above")).toEqual(["foto", "titulo", "fondo", "boton"]);
  });

  it("debajo de otra capa = justo detrás de ella", () => {
    expect(dropLayer(ids, "boton", "foto", "below")).toEqual(["fondo", "boton", "foto", "titulo"]);
  });

  it("soltarla sobre sí misma o sobre algo desconocido no cambia nada", () => {
    expect(dropLayer(ids, "foto", "foto", "above")).toEqual(ids);
    expect(dropLayer(ids, "foto", "nada", "above")).toEqual(ids);
  });
});

describe("sortByOrder", () => {
  const items = ids.map((id) => ({ id }));

  it("ordena según la lista", () => {
    expect(sortByOrder(items, ["boton", "fondo", "foto", "titulo"]).map((i) => i.id)).toEqual(["boton", "fondo", "foto", "titulo"]);
  });

  it("lo que no está en la lista queda delante, y sin lista no cambia nada", () => {
    expect(sortByOrder(items, ["titulo", "foto"]).map((i) => i.id)).toEqual(["titulo", "foto", "fondo", "boton"]);
    expect(sortByOrder(items, undefined)).toEqual(items);
  });
});
