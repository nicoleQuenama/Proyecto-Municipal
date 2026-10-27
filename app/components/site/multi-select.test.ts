import { describe, expect, it } from "vitest";
import { INITIAL_SITE } from "./initial-site";
import { selectBlocks, selectionOf } from "./multi-select";
import { siteReducer } from "./site-reducer";
import { TITLE_SELECTION } from "./types";

describe("selección múltiple", () => {
  it("varias secciones quedan seleccionadas y la primera es la activa", () => {
    const state = selectBlocks(INITIAL_SITE, ["a", "b", "c"]);
    expect(state.selectedId).toBe("a");
    expect(selectionOf(state)).toEqual(["a", "b", "c"]);
  });

  it("una sola es una selección normal", () => {
    const state = selectBlocks(INITIAL_SITE, ["a"]);
    expect(state.selectedBlockIds).toBeUndefined();
    expect(selectionOf(state)).toEqual(["a"]);
  });

  it("sin ninguna se quita la selección", () => {
    expect(selectionOf(selectBlocks(selectBlocks(INITIAL_SITE, ["a", "b"]), []))).toEqual([]);
  });

  it("pasa a la página donde están las secciones", () => {
    const state = siteReducer(INITIAL_SITE, { type: "block/select-many", ids: ["a", "b"], pageId: "otra" });
    expect(state.currentPageId).toBe("otra");
  });

  it("elegir otra sección suelta el grupo", () => {
    const many = siteReducer(INITIAL_SITE, { type: "block/select-many", ids: ["a", "b"] });
    const one = siteReducer(many, { type: "block/select", id: "z" });
    expect(selectionOf(one)).toEqual(["z"]);
    expect(selectionOf({ selectedId: TITLE_SELECTION, selectedBlockIds: undefined })).toEqual([]);
  });
});
