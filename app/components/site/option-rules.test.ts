import { describe, expect, it } from "vitest";
import { getCardsForOption, getComponentOptions } from "./container-card-rules";
import { addOption, removeOption } from "./option-rules";
import { newElement } from "./component-templates";
import type { CanvasElement, ComponentDef } from "./types";

const withId = (id: string, extra: Partial<CanvasElement> = {}) => newElement("rect", id, { role: "container", ...extra });

/** Un componente con tres opciones y una tarjeta en cada una. */
function sample(): ComponentDef {
  const picker = newElement("rect", "c-picker", { control: { kind: "input", name: "opcion", inputType: "radio", options: ["Decretos", "Leyes", "Normativas"] } });
  return {
    id: "c", name: "Trámites", description: "", category: "cards", width: 1024, height: 500, custom: true,
    links: { "c-opt3-c1-card": { kind: "url", url: "x" } as never, "c-opt1-c1-card": { kind: "url", url: "y" } as never },
    elements: [picker, withId("c-opt1-c1-card"), withId("c-opt2-c1-card"), withId("c-opt3-c1-card"), newElement("text", "c-opt3-c1-title", { parentId: "c-opt3-c1-card" })],
  };
}

describe("removeOption", () => {
  it("quita la opción con sus tarjetas y renumera las siguientes", () => {
    const next = removeOption(sample(), 1); // «Leyes»

    expect(getComponentOptions(next).map((o) => o.label)).toEqual(["Decretos", "Normativas"]);
    expect(next.elements.some((e) => e.id.includes("-opt3-"))).toBe(false);
    expect(getCardsForOption(next, "opt2").map((c) => c.id)).toEqual(["c-opt2-c1-card"]);
  });

  it("arrastra hijos y enlaces al nuevo número", () => {
    const next = removeOption(sample(), 1);

    expect(next.elements.find((e) => e.id === "c-opt2-c1-title")?.parentId).toBe("c-opt2-c1-card");
    expect(Object.keys(next.links)).toEqual(expect.arrayContaining(["c-opt1-c1-card", "c-opt2-c1-card"]));
  });

  it("nunca deja el componente sin opciones", () => {
    let def = removeOption(sample(), 0);
    def = removeOption(def, 0);
    expect(getComponentOptions(removeOption(def, 0))).toHaveLength(1);
  });
});

describe("addOption", () => {
  it("agrega una opción al final, vacía", () => {
    const result = addOption(sample(), "Resoluciones")!;

    expect(getComponentOptions(result.component).map((o) => o.label)).toEqual(["Decretos", "Leyes", "Normativas", "Resoluciones"]);
    expect(result.optionKey).toBe("opt4");
    expect(getCardsForOption(result.component, "opt4")).toHaveLength(0);
  });

  it("sin nombre usa «Opción N» y sin control no hace nada", () => {
    expect(getComponentOptions(addOption(sample())!.component).at(-1)?.label).toBe("Opción 4");
    expect(addOption({ ...sample(), elements: [] })).toBeNull();
  });
});
