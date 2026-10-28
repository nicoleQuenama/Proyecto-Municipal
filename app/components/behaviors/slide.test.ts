import { describe, expect, it } from "vitest";
import { slideDestination } from "./slide";

const starts = [0, 300, 620, 1000];

describe("deslizar un carrusel", () => {
  it("siguiente pasa a la tarjeta que sigue, sin quedarse en la misma", () => {
    expect(slideDestination(starts, 0, "next", 1400)).toBe(300);
    expect(slideDestination(starts, 300, "next", 1400)).toBe(620);
    expect(slideDestination(starts, 1000, "next", 1400)).toBe(1000);
  });

  it("anterior vuelve a la tarjeta de antes", () => {
    expect(slideDestination(starts, 620, "prev", 1400)).toBe(300);
    expect(slideDestination(starts, 0, "prev", 1400)).toBe(0);
  });

  it("entre dos tarjetas, siguiente va a la próxima y anterior a la que ya pasó", () => {
    expect(slideDestination(starts, 450, "next", 1400)).toBe(620);
    expect(slideDestination(starts, 450, "prev", 1400)).toBe(300);
  });

  it("al principio y al final", () => {
    expect(slideDestination(starts, 620, "start", 1400)).toBe(0);
    expect(slideDestination(starts, 0, "end", 1400)).toBe(1400);
  });
});
