import { describe, expect, it } from "vitest";
import { selectionOf, toggleBlock } from "./multi-select";

describe("selección de varias secciones", () => {
  it("Ctrl+clic suma y quita", () => {
    expect(toggleBlock(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleBlock(["a", "b"], "a")).toEqual(["b"]);
    expect(toggleBlock([], "a")).toEqual(["a"]);
  });
  it("la selección es la lista si la activa está en ella, o solo la activa", () => {
    expect(selectionOf({ selectedId: "a", selectedBlockIds: ["a", "b"] })).toEqual(["a", "b"]);
    expect(selectionOf({ selectedId: "c", selectedBlockIds: ["a", "b"] })).toEqual(["c"]);
  });
});
