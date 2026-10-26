import { describe, expect, it } from "vitest";
import { frameFromDrag } from "./draw-plan";

const bounds = { width: 1000, height: 800 };
const draw = (start: [number, number], end: [number, number], extra: { kind?: "rect" | "line"; constrain?: boolean } = {}) =>
  frameFromDrag({ kind: extra.kind ?? "rect", start: { x: start[0], y: start[1] }, end: { x: end[0], y: end[1] }, constrain: extra.constrain ?? false, bounds });

describe("frameFromDrag", () => {
  it("un rectángulo arrastrado da su posición y tamaño", () => {
    expect(draw([100, 50], [300, 170])).toEqual({ x: 100, y: 50, width: 200, height: 120 });
  });

  it("arrastrar hacia arriba o a la izquierda también funciona", () => {
    expect(draw([300, 170], [100, 50])).toEqual({ x: 100, y: 50, width: 200, height: 120 });
  });

  it("Mayús da proporción 1:1 con el lado mayor", () => {
    expect(draw([100, 100], [300, 150], { constrain: true })).toEqual({ x: 100, y: 100, width: 200, height: 200 });
    expect(draw([300, 300], [250, 100], { constrain: true })).toMatchObject({ x: 100, y: 100, width: 200, height: 200 });
  });

  it("Mayús no saca la figura de la página", () => {
    const frame = draw([900, 700], [990, 790], { constrain: true });
    expect(frame.x + frame.width).toBeLessThanOrEqual(1000);
    expect(frame.y + frame.height).toBeLessThanOrEqual(800);
    expect(frame.width).toBe(frame.height);
  });

  it("lo arrastrado fuera de la página se recorta a ella", () => {
    expect(draw([900, 700], [1500, 1200])).toEqual({ x: 900, y: 700, width: 100, height: 100 });
  });

  it("un clic coloca la figura con su tamaño de partida", () => {
    expect(draw([100, 100], [101, 100])).toEqual({ x: 100, y: 100, width: 160, height: 100 });
    expect(draw([950, 780], [950, 780])).toMatchObject({ x: 840, y: 680 });
  });

  it("una línea que sube queda marcada como invertida", () => {
    expect(draw([100, 300], [300, 100], { kind: "line" })).toEqual({ x: 100, y: 100, width: 200, height: 200, flipped: true });
    expect(draw([100, 100], [300, 300], { kind: "line" }).flipped).toBeUndefined();
  });

  it("una línea con Mayús se endereza", () => {
    expect(draw([100, 100], [400, 130], { kind: "line", constrain: true })).toEqual({ x: 100, y: 100, width: 300, height: 0 });
  });
});
