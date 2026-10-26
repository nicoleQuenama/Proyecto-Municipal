import { describe, expect, it } from "vitest";
import { averageColor, contrastRatio, parseCssColor, readableOn } from "./color";

const white = parseCssColor("#fff")!;
const black = parseCssColor("#000")!;

describe("color", () => {
  it("lee hex, rgb y hsl", () => {
    expect(parseCssColor("#ff0000")).toMatchObject({ r: 255, g: 0, b: 0 });
    expect(parseCssColor("rgb(0, 128, 255)")).toMatchObject({ r: 0, g: 128, b: 255 });
    expect(parseCssColor("hsl(0 100% 50%)")).toMatchObject({ r: 255, g: 0, b: 0 });
    expect(parseCssColor("var(--x)")).toBeNull();
  });

  it("promedia un degradado", () => {
    const mean = averageColor("linear-gradient(90deg, #000000, #ffffff)")!;
    expect(Math.round(mean.r)).toBe(128);
  });

  it("calcula el contraste WCAG", () => {
    expect(contrastRatio(black, white)).toBeCloseTo(21, 0);
    expect(contrastRatio(parseCssColor("#777777")!, white)).toBeLessThan(4.6);
    expect(contrastRatio(parseCssColor("#aaaaaa")!, white)).toBeLessThan(4.5);
    expect(contrastRatio(parseCssColor("#595959")!, white)).toBeGreaterThanOrEqual(4.5);
  });

  it("encuentra un color legible parecido", () => {
    const fixed = parseCssColor(readableOn(parseCssColor("#aaaaaa")!, white))!;
    expect(contrastRatio(fixed, white)).toBeGreaterThanOrEqual(4.5);
  });
});
