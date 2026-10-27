import { describe, expect, it } from "vitest";
import { normalizeHex } from "./hex-color";

describe("normalizeHex", () => {
  it("acepta con o sin #, en mayúsculas o minúsculas", () => {
    expect(normalizeHex("#0B1026")).toBe("#0b1026");
    expect(normalizeHex("0b1026")).toBe("#0b1026");
    expect(normalizeHex("  #FFF ")).toBe("#ffffff");
  });

  it("rechaza lo que no es un color", () => {
    expect(normalizeHex("")).toBeNull();
    expect(normalizeHex("#12")).toBeNull();
    expect(normalizeHex("rojo")).toBeNull();
    expect(normalizeHex("#12345g")).toBeNull();
  });
});
