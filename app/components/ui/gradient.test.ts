import { describe, expect, it } from "vitest";
import { composeColor, parseColor } from "./color-alpha";
import { buildGradient, DEFAULT_GRADIENT, isGradient, parseGradient } from "./gradient";
import { GRADIENT_PRESETS } from "./gradient-presets";

describe("buildGradient", () => {
  it("escribe un degradado lineal", () => {
    expect(buildGradient(DEFAULT_GRADIENT)).toBe("linear-gradient(135deg, #ff4d5e 0%, #4d8dff 100%)");
  });
  it("escribe uno radial y ordena las paradas", () => {
    const css = buildGradient({ type: "radial", angle: 0, stops: [{ color: "#000", position: 80 }, { color: "#fff", position: 10 }] });
    expect(css).toBe("radial-gradient(circle at 50% 50%, #fff 10%, #000 80%)");
  });
});

describe("parseGradient", () => {
  it("ida y vuelta con los prediseñados", () => {
    for (const { gradient } of GRADIENT_PRESETS) {
      const back = parseGradient(buildGradient(gradient))!;
      expect(back.type).toBe(gradient.type);
      expect(back.stops.map((s) => s.color)).toEqual(gradient.stops.map((s) => s.color));
    }
  });
  it("lee colores con comas internas", () => {
    const g = parseGradient("linear-gradient(90deg, rgba(0, 0, 0, 0.5) 20%, #fff 100%)");
    expect(g?.stops[0]).toEqual({ color: "rgba(0, 0, 0, 0.5)", position: 20 });
    expect(g?.angle).toBe(90);
  });
  it("entiende «to right» y la falta de ángulo", () => {
    expect(parseGradient("linear-gradient(to right, red, blue)")?.angle).toBe(90);
    expect(parseGradient("linear-gradient(red, blue)")?.angle).toBe(180);
    expect(parseGradient("linear-gradient(red, blue)")?.stops.map((s) => s.position)).toEqual([0, 100]);
  });
  it("lee un radial con forma", () => {
    expect(parseGradient("radial-gradient(circle at center, red, blue)")?.type).toBe("radial");
  });
  it("rechaza lo que no es degradado o tiene una sola parada", () => {
    expect(parseGradient("#fff")).toBeNull();
    expect(parseGradient("linear-gradient(red)")).toBeNull();
    expect(isGradient("conic-gradient(red, blue)")).toBe(false);
  });
});

describe("color con opacidad", () => {
  it("separa tono y opacidad", () => {
    expect(parseColor("rgba(255, 0, 0, 0.5)")).toEqual({ hex: "#ff0000", alpha: 0.5 });
    expect(parseColor("#f00")).toEqual({ hex: "#ff0000", alpha: 1 });
    expect(parseColor("#ff000080")?.alpha).toBe(0.5);
    expect(parseColor("var(--x)")).toBeNull();
  });
  it("une de vuelta", () => {
    expect(composeColor({ hex: "#ff0000", alpha: 1 })).toBe("#ff0000");
    expect(composeColor({ hex: "#ff0000", alpha: 0.5 })).toBe("rgba(255, 0, 0, 0.5)");
  });
});
