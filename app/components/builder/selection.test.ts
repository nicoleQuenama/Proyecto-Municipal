import { describe, expect, it } from "vitest";
import { newElement } from "../site/component-templates";
import { initialBuilderState } from "./builder-types";
import { pasteElements } from "./paste-element";
import { selectIn, selectedIdsOf, withoutNested } from "./selection";

const base = initialBuilderState();

describe("selectIn", () => {
  it("sin Ctrl reemplaza la selección", () => {
    const next = selectIn(selectIn(base, "a"), "b");
    expect(selectedIdsOf(next)).toEqual(["b"]);
  });

  it("con Ctrl suma y quita sin perder las demás", () => {
    const three = selectIn(selectIn(selectIn(base, "a"), "b", true), "c", true);
    expect(selectedIdsOf(three).sort()).toEqual(["a", "b", "c"]);
    expect(three.selectedId).toBe("c");

    const without = selectIn(three, "c", true);
    expect(selectedIdsOf(without).sort()).toEqual(["a", "b"]);
    expect(without.selectedId).toBe("b");
  });

  it("null limpia todo", () => {
    expect(selectedIdsOf(selectIn(selectIn(base, "a"), null))).toEqual([]);
  });
});

describe("withoutNested", () => {
  it("descarta lo que va dentro de otro seleccionado", () => {
    const box = newElement("rect", "box", {});
    const inner = newElement("text", "inner", { parentId: "box" });
    const other = newElement("rect", "other", {});
    expect(withoutNested([box, inner, other], ["box", "inner", "other"])).toEqual(["box", "other"]);
  });
});

describe("pasteElements con varios", () => {
  it("pega todo el grupo junto y lo deja seleccionado", () => {
    const a = newElement("rect", "a", { x: 10, y: 10, width: 20, height: 20 });
    const b = newElement("rect", "b", { x: 50, y: 10, width: 20, height: 20 });
    const next = pasteElements({ ...base, elements: [a, b] }, [a, b], ["a2", "b2"]);

    expect(next.elements.map((e) => [e.id, e.x])).toEqual([["a", 10], ["b", 50], ["a2", 22], ["b2", 62]]);
    expect(selectedIdsOf(next).sort()).toEqual(["a2", "b2"]);
  });
});
