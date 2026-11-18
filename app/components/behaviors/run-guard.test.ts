import { describe, expect, it } from "vitest";
import { alreadyRan } from "./run-guard";

describe("alreadyRan", () => {
  const element = {} as HTMLElement;
  it("la primera vez no ha corrido", () => {
    expect(alreadyRan(null, { element, key: "a" })).toBe(false);
  });
  it("el segundo montaje de React sobre el mismo elemento y código no vuelve a correr", () => {
    expect(alreadyRan({ element, key: "a" }, { element, key: "a" })).toBe(true);
  });
  it("otro código, o un elemento nuevo, sí corre", () => {
    expect(alreadyRan({ element, key: "a" }, { element, key: "b" })).toBe(false);
    expect(alreadyRan({ element, key: "a" }, { element: {} as HTMLElement, key: "a" })).toBe(false);
  });
});
