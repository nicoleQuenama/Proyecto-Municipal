import { describe, expect, it } from "vitest";
import { shouldDeliver, type Audience } from "../../realtime/units.mts";

const person = (units: string[], all = false): Audience => ({ units, all });

describe("shouldDeliver (quién ve a quién en tiempo real)", () => {
  it("comparten una unidad: se ven", () => {
    expect(shouldDeliver(person(["u1", "u2"]), person(["u2"]))).toBe(true);
  });

  it("no comparten ninguna: no se ven", () => {
    expect(shouldDeliver(person(["u1"]), person(["u2"]))).toBe(false);
  });

  it("el superadmin lo recibe todo", () => {
    expect(shouldDeliver(person(["u1"]), person([], true))).toBe(true);
  });

  it("nadie recibe lo que emite el superadmin (así no se filtra contenido ajeno)", () => {
    expect(shouldDeliver(person([], true), person(["u1"]))).toBe(false);
  });

  it("dos superadmin se ven", () => {
    expect(shouldDeliver(person([], true), person([], true))).toBe(true);
  });

  it("una organización sin unidades funciona como siempre: todos se ven", () => {
    expect(shouldDeliver(person([]), person([]))).toBe(true);
  });

  it("quien no tiene unidad no ve a quien sí, ni al revés", () => {
    expect(shouldDeliver(person([]), person(["u1"]))).toBe(false);
    expect(shouldDeliver(person(["u1"]), person([]))).toBe(false);
  });
});
