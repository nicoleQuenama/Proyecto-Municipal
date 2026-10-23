import { describe, expect, it } from "vitest";
import { buildSteps } from "./build-steps";
import { DEFAULT_PARAMS, PRESETS, type PresetId } from "./presets";

const params = { ...DEFAULT_PARAMS, duration: 600, delay: 100, stagger: 50 };
const id = Object.keys(PRESETS)[0] as PresetId;

describe("buildSteps", () => {
  it("escalona cada destino con la cascada y respeta el retraso", () => {
    const steps = buildSteps(id, params, [{ blockId: "b", key: "a" }, { blockId: "b", key: "c" }], "linear");
    const starts = (key: string) => steps.filter((s) => s.key === key).map((s) => s.at);
    expect(Math.min(...starts("a"))).toBeGreaterThanOrEqual(100);
    expect(Math.min(...starts("c"))).toBeGreaterThanOrEqual(Math.min(...starts("a")) + 50);
  });

  it("desplaza todo con startAt", () => {
    const [a] = buildSteps(id, params, [{ blockId: "b", key: "a" }], "linear");
    const [b] = buildSteps(id, params, [{ blockId: "b", key: "a" }], "linear", 1000);
    expect(b.at - a.at).toBe(1000);
  });
});
