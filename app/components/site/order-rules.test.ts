import { describe, expect, it } from "vitest";
import { INITIAL_SITE } from "./initial-site";
import { orderBlocks } from "./order-rules";
import { siteReducer } from "./site-reducer";
import type { SiteState } from "./types";

const ids = (state: SiteState) => state.pages[0].blocks.map((b) => b.id).join("");
const withBlocks = (letters: string): SiteState => ({
  ...INITIAL_SITE,
  pages: [{ ...INITIAL_SITE.pages[0], blocks: [...letters].map((id) => ({ id, componentId: "c" })) }],
});

describe("orden de capas", () => {
  it("al frente y al fondo", () => {
    expect(ids(orderBlocks(withBlocks("abcd"), "inicio", ["b"], "front"))).toBe("acdb");
    expect(ids(orderBlocks(withBlocks("abcd"), "inicio", ["c"], "back"))).toBe("cabd");
  });

  it("subir y bajar una capa", () => {
    expect(ids(orderBlocks(withBlocks("abcd"), "inicio", ["b"], "forward"))).toBe("acbd");
    expect(ids(orderBlocks(withBlocks("abcd"), "inicio", ["c"], "backward"))).toBe("acbd");
  });

  it("en los extremos no cambia nada", () => {
    expect(ids(orderBlocks(withBlocks("abc"), "inicio", ["c"], "forward"))).toBe("abc");
    expect(ids(orderBlocks(withBlocks("abc"), "inicio", ["a"], "backward"))).toBe("abc");
  });

  it("varias a la vez conservan su orden relativo", () => {
    expect(ids(orderBlocks(withBlocks("abcde"), "inicio", ["b", "d"], "front"))).toBe("acebd");
    expect(ids(orderBlocks(withBlocks("abcde"), "inicio", ["b", "c"], "forward"))).toBe("adbce");
    expect(ids(orderBlocks(withBlocks("abcde"), "inicio", ["c", "d"], "backward"))).toBe("acdbe");
  });

  it("llega por el reductor", () => {
    const next = siteReducer(withBlocks("abc"), { type: "block/order", pageId: "inicio", blockIds: ["a"], to: "front" });
    expect(ids(next)).toBe("bca");
  });
});
