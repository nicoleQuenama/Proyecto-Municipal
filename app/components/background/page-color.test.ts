import { describe, expect, it } from "vitest";
import { INITIAL_SITE } from "../site/initial-site";
import { siteReducer } from "../site/site-reducer";

describe("color de la página", () => {
  it("se pone y se quita", () => {
    const set = siteReducer(INITIAL_SITE, { type: "page/color", pageId: "inicio", color: "#0a0a12" });
    expect(set.pages[0].color).toBe("#0a0a12");
    const cleared = siteReducer(set, { type: "page/color", pageId: "inicio", color: undefined });
    expect(cleared.pages[0].color).toBeUndefined();
  });
});
