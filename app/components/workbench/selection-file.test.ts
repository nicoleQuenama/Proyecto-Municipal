import { describe, expect, it } from "vitest";
import { CODE_COMPONENT_ID } from "../site/code-defaults";
import { INITIAL_SITE } from "../site/initial-site";
import { siteReducer } from "../site/site-reducer";
import { selectionFile } from "./selection-file";

describe("archivo de lo que está seleccionado", () => {
  it("una página nueva (sin bloques) abre su código", () => {
    const state = siteReducer(INITIAL_SITE, { type: "page/create", id: "nueva", name: "Nueva" });
    expect(selectionFile(state)).toEqual({ kind: "page-js", pageId: "nueva" });
  });

  it("una sección seleccionada abre su HTML", () => {
    let state = siteReducer(INITIAL_SITE, { type: "page/create", id: "nueva", name: "Nueva" });
    state = siteReducer(state, { type: "block/add", id: "b1", componentId: CODE_COMPONENT_ID, pageId: "nueva" });
    state = siteReducer(state, { type: "block/select", id: "b1" });
    expect(selectionFile(state)).toEqual({ kind: "block-html", pageId: "nueva", blockId: "b1" });
  });
});
