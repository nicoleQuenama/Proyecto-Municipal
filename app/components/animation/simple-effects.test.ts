import { describe, expect, it } from "vitest";
import { groupEffects, removeEffect, retimeEffect } from "./simple-effects";
import type { AnimationStep } from "./types";

const step = (id: string, key: string, prop: AnimationStep["prop"], at: number, duration: number): AnimationStep =>
  ({ id, blockId: "b", key, prop, from: 0, to: 1, at, duration });

const steps = [
  step("a", "title", "opacity", 0, 600),
  step("b", "title", "move", 0, 600),
  step("c", "title", "scale", 2000, 400),
  step("d", "button", "opacity", 300, 600),
];

describe("groupEffects", () => {
  it("junta lo que pasa a la vez en una pieza y separa lo que va después", () => {
    const effects = groupEffects(steps);
    expect(effects).toHaveLength(3);
    expect(effects[0]).toMatchObject({ key: "title", at: 0, duration: 600, props: ["opacity", "move"] });
    expect(effects.map((e) => e.at)).toEqual([0, 300, 2000]);
  });
});

describe("retimeEffect", () => {
  const [first] = groupEffects(steps);

  it("mover el inicio desplaza todos sus pasos", () => {
    const moved = retimeEffect(steps, first, { at: 1000 });
    expect(moved.filter((s) => ["a", "b"].includes(s.id)).map((s) => s.at)).toEqual([1000, 1000]);
    expect(moved.find((s) => s.id === "c")?.at).toBe(2000);
  });

  it("cambiar la duración estira todos sus pasos por igual", () => {
    const longer = retimeEffect(steps, first, { duration: 1200 });
    expect(longer.find((s) => s.id === "a")?.duration).toBe(1200);
  });
});

describe("removeEffect", () => {
  it("quita todos los pasos del efecto", () => {
    expect(removeEffect(steps, groupEffects(steps)[0]).map((s) => s.id)).toEqual(["c", "d"]);
  });
});
