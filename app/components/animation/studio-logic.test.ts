import { describe, expect, it } from "vitest";
import { formatTime } from "./format-time";
import { duplicateStep } from "./timeline";
import { pxPerMsFor, tickStepFor, ticksFor } from "./timeline-scale";
import type { AnimationStep } from "./types";

const step: AnimationStep = { id: "a", blockId: "b", key: "k", prop: "opacity", from: 0, to: 1, at: 200, duration: 400 };

describe("formatTime", () => {
  it("escribe minutos, segundos y décimas", () => {
    expect(formatTime(0)).toBe("0:00.0");
    expect(formatTime(1500)).toBe("0:01.5");
    expect(formatTime(61200)).toBe("1:01.2");
  });
});

describe("escala del eje", () => {
  it("con más zoom las marcas se acercan", () => {
    expect(tickStepFor(0.1)).toBe(1000);
    expect(tickStepFor(1)).toBe(100);
  });

  it("las marcas llegan hasta el final", () => {
    expect(ticksFor(2000, 0.1)).toEqual([0, 1000, 2000]);
  });

  it("con zoom 1 todo cabe en el ancho", () => {
    expect(pxPerMsFor(1000, 2000, 1)).toBe(0.5);
    expect(pxPerMsFor(1000, 2000, 4)).toBe(2);
  });
});

describe("duplicateStep", () => {
  it("copia el paso a continuación del original", () => {
    const out = duplicateStep([step], "a", "b2");
    expect(out).toHaveLength(2);
    expect(out[1]).toMatchObject({ id: "b2", at: 600, duration: 400, prop: "opacity" });
  });

  it("ignora un id que no existe", () => {
    expect(duplicateStep([step], "zzz", "x")).toEqual([step]);
  });
});
