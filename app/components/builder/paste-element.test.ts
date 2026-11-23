import { describe, expect, it } from "vitest";
import { newElement } from "../site/component-templates";
import { initialBuilderState } from "./builder-types";
import { pasteElements } from "./paste-element";

const panel = newElement("rect", "panel", { x: 20, y: 20, width: 100, height: 100 });
const label = newElement("text", "label", { x: 30, y: 30, width: 40, height: 20, parentId: "panel", offset: { x: 10, y: 10 } });
const state = { ...initialBuilderState(), elements: [panel, label] };

describe("pasteElements", () => {
  it("pega con ids nuevos, desplazado y con el contenido unido al nuevo contenedor", () => {
    const next = pasteElements(state, [panel, label], ["p2", "l2"]);
    const [, , copyPanel, copyLabel] = next.elements;

    expect(next.elements).toHaveLength(4);
    expect([copyPanel.id, copyPanel.x, copyPanel.y]).toEqual(["p2", 32, 32]);
    expect([copyLabel.id, copyLabel.parentId, copyLabel.x, copyLabel.y]).toEqual(["l2", "p2", 42, 42]);
    expect(next.selectedId).toBe("p2");
  });

  it("no cambia nada si no hay nada copiado", () => {
    expect(pasteElements(state, [], [])).toBe(state);
  });
});
