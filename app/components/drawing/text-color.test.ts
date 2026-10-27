import { describe, expect, it } from "vitest";
import { textColorOn } from "./text-color";

describe("textColorOn", () => {
  it("tinta clara sobre fondos oscuros", () => {
    expect(textColorOn("#0b1026")).toBe("#ffffff");
    expect(textColorOn("rgb(15, 23, 42)")).toBe("#ffffff");
  });

  it("tinta oscura sobre fondos claros", () => {
    expect(textColorOn("#ffffff")).toBe("#0f172a");
    expect(textColorOn("#ffd166")).toBe("#0f172a");
  });

  it("un degradado cuenta por su color medio", () => {
    expect(textColorOn("linear-gradient(#000000, #1e293b)")).toBe("#ffffff");
  });

  it("sin fondo legible, tinta oscura", () => {
    expect(textColorOn(null)).toBe("#0f172a");
    expect(textColorOn("var(--fondo)")).toBe("#0f172a");
  });

  it("un fondo translúcido se mezcla con la página blanca", () => {
    expect(textColorOn("rgba(0, 0, 0, 0.1)")).toBe("#0f172a");
  });
});
