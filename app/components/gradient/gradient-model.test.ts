import { describe, expect, it } from "vitest";
import {
  addStop,
  angleOf,
  defaultGradient,
  lineLength,
  moveStop,
  parseGradient,
  pointAt,
  positionOf,
  removeStop,
  setAngle,
  setStopColor,
  toCss,
} from "./gradient-model";

describe("degradado: CSS", () => {
  it("se escribe ordenado por posición", () => {
    const g = { angle: 90, stops: [{ color: "#fff", position: 100 }, { color: "#000", position: 0 }] };
    expect(toCss(g)).toBe("linear-gradient(90deg, #000 0%, #fff 100%)");
  });

  it("lo que se escribe se vuelve a leer igual", () => {
    const g = { angle: 135, stops: [{ color: "rgb(1, 2, 3)", position: 10 }, { color: "#8b5cf6", position: 90 }] };
    expect(parseGradient(toCss(g))).toEqual(g);
  });

  it("un color liso o un degradado no lineal no se leen", () => {
    expect(parseGradient("#0a0a12")).toBeNull();
    expect(parseGradient("radial-gradient(#000, #fff)")).toBeNull();
    expect(parseGradient(undefined)).toBeNull();
  });
});

describe("degradado: edición", () => {
  it("añade un punto con el color del más cercano, y quita sin bajar de dos", () => {
    const g = addStop(defaultGradient("#111111", "#eeeeee"), 90);
    expect(g.stops).toHaveLength(3);
    expect(g.stops[2]).toEqual({ color: "#eeeeee", position: 90 });
    expect(removeStop(removeStop(g, 2), 0).stops).toHaveLength(2);
  });

  it("mueve y recolorea un punto sin salirse de 0–100", () => {
    const g = setStopColor(moveStop(defaultGradient(), 0, 140), 1, "#ff0000");
    expect(g.stops[0].position).toBe(100);
    expect(g.stops[1].color).toBe("#ff0000");
  });

  it("el ángulo se mantiene entre 0 y 359", () => {
    expect(setAngle(defaultGradient(), 370).angle).toBe(10);
    expect(setAngle(defaultGradient(), -90).angle).toBe(270);
  });
});

describe("degradado: geometría", () => {
  const center = { x: 100, y: 50 };

  it("la línea mide el ancho a 90° y el alto a 0°", () => {
    expect(lineLength(200, 100, 90)).toBeCloseTo(200);
    expect(lineLength(200, 100, 0)).toBeCloseTo(100);
  });

  it("el punto de cada extremo cae en el borde de la caja", () => {
    const start = pointAt(center, 90, 200, 0);
    const end = pointAt(center, 90, 200, 100);
    expect(start.x).toBeCloseTo(0);
    expect(end.x).toBeCloseTo(200);
  });

  it("arrastrar un punto da su posición, y girar da el ángulo", () => {
    expect(positionOf(center, 90, 200, { x: 150, y: 80 })).toBeCloseTo(75);
    expect(positionOf(center, 90, 200, { x: 999, y: 0 })).toBe(100);
    expect(angleOf(center, { x: 200, y: 50 })).toBeCloseTo(90);
    expect(angleOf(center, { x: 100, y: 0 })).toBeCloseTo(0);
  });
});
