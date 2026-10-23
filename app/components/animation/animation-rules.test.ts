import { describe, expect, it } from "vitest";
import type { Behavior } from "../behaviors/types";
import type { SiteState } from "../site/types";
import { addAnimation, deleteAnimation } from "./animation-rules";

const animation = { id: "an", name: "A", steps: [] };
const block = (id: string) => ({ id, componentId: "c" });
const state = { pages: [{ id: "p", blocks: [block("b1"), block("b2")] }] } as unknown as SiteState;
const play = { action: { kind: "play", animationId: "an" } } as unknown as Behavior;

describe("animation-rules", () => {
  it("guarda la animación y deja la interacción solo en su sección", () => {
    const next = addAnimation(state, "p", animation, { blockId: "b1", behavior: play });
    expect(next.pages[0].animations).toEqual([animation]);
    expect(next.pages[0].blocks[0].behaviors).toEqual([play]);
    expect(next.pages[0].blocks[1].behaviors).toBeUndefined();
  });

  it("al borrarla quita también las interacciones que la reproducían", () => {
    const added = addAnimation(state, "p", animation, { blockId: "b1", behavior: play });
    const next = deleteAnimation(added, "p", "an");
    expect(next.pages[0].animations).toEqual([]);
    expect(next.pages[0].blocks[0].behaviors).toEqual([]);
  });
});
