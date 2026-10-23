import { describe, expect, it } from "vitest";
import { COALESCE_MS, MIN_STEP_MS, recordChanges, type ValueMap } from "./diff";
import { sealSteps } from "./session";

const at = (x: number): ValueMap => ({ "b:e": { blockId: "b", key: "e", values: { x, y: 0 } } });

describe("recordChanges", () => {
  it("no graba lo que no cambia", () => {
    expect(recordChanges([], at(1), at(1), 100, 0)).toEqual([]);
  });

  it("ignora destinos que no existían antes", () => {
    expect(recordChanges([], {}, at(5), 100, 0)).toEqual([]);
  });

  it("crea un paso con la duración mínima", () => {
    const [step] = recordChanges([], at(0), at(10), 500, 1);
    expect(step).toMatchObject({ prop: "x", from: 0, to: 10, at: 500, duration: MIN_STEP_MS, gesture: 1 });
  });

  it("junta los cambios de un mismo gesto en un solo paso", () => {
    const first = recordChanges([], at(0), at(10), 500, 1);
    const steps = recordChanges(first, at(10), at(30), 1200, 1);
    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({ from: 0, to: 30, duration: 700 });
  });

  it("separa gestos distintos o muy alejados en el tiempo", () => {
    const first = recordChanges([], at(0), at(10), 500, 1);
    expect(recordChanges(first, at(10), at(20), 600, 2)).toHaveLength(2);
    expect(recordChanges(first, at(10), at(20), 500 + MIN_STEP_MS + COALESCE_MS + 1, 1)).toHaveLength(2);
  });
});

describe("sealSteps", () => {
  it("empieza en el primer paso y quita las marcas de gesto", () => {
    const base = { blockId: "b", key: "e", prop: "x" as const, from: 0, to: 1, duration: 400, gesture: 3 };
    const sealed = sealSteps([{ ...base, id: "a", at: 1000 }, { ...base, id: "b", at: 1500.4 }]);
    expect(sealed.map((s) => s.at)).toEqual([0, 500]);
    expect(sealed.every((s) => s.gesture === undefined)).toBe(true);
  });
});
