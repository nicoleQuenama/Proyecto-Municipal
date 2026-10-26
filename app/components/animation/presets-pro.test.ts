import { describe, expect, it } from "vitest";
import { buildSteps } from "./build-steps";
import { DEFAULT_PARAMS, PRESETS, type PresetId } from "./presets";
import { PRO_PRESETS } from "./presets-pro";
import { STEP_PROPS } from "./step-props";
import { STEP_META } from "./step-meta";

const target = [{ blockId: "b", key: "a" }];
const ids = Object.keys(PRO_PRESETS) as PresetId[];
const build = (id: PresetId, targets = target) => buildSteps(id, DEFAULT_PARAMS, targets, "ease-in-out");

describe("efectos propios", () => {
  it("son al menos 8 y están en la galería", () => {
    expect(ids.length).toBeGreaterThanOrEqual(8);
    ids.forEach((id) => expect(PRESETS[id]).toBeDefined());
  });

  it("solo usan propiedades que se saben pintar y editar", () => {
    ids.flatMap((id) => build(id)).forEach((s) => {
      expect(STEP_PROPS[s.prop](s.from)).toBeTruthy();
      expect(STEP_PROPS[s.prop](s.to)).toBeTruthy();
      expect(STEP_META[s.prop]).toBeDefined();
    });
  });

  it("los bucles son de un solo tramo, sin fin y de ida y vuelta", () => {
    for (const id of ["float", "breathe", "glow-pulse"] as PresetId[]) {
      const steps = build(id);
      expect(steps).toHaveLength(1);
      expect(steps[0]).toMatchObject({ iterations: 0, direction: "alternate" });
    }
  });

  it("los efectos de un solo golpe no llevan repeticiones", () => {
    expect(build("overshoot").every((s) => s.iterations === undefined)).toBe(true);
  });

  it("usa la aceleración propia del tramo y no la elegida", () => {
    expect(build("typewriter")[0].easing).toBe("steps(28, end)");
  });

  it("los efectos lentos alargan la duración", () => {
    expect(build("ken-burns")[0].duration).toBe(DEFAULT_PARAMS.duration * 6);
  });

  it("la cascada escalona las piezas", () => {
    const steps = build("cascade", [...target, { blockId: "b", key: "c" }]);
    const first = (key: string) => Math.min(...steps.filter((s) => s.key === key).map((s) => s.at));
    expect(first("c") - first("a")).toBe(DEFAULT_PARAMS.stagger);
  });

  it("el latido encadena cuatro pulsos que no se solapan", () => {
    const steps = build("heartbeat");
    expect(steps).toHaveLength(4);
    steps.slice(1).forEach((s, i) => expect(s.at).toBeGreaterThanOrEqual(steps[i].at + steps[i].duration - 1));
  });
});
