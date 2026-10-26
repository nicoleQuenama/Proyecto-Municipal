import { describe, expect, it } from "vitest";
import { newElement } from "../site/component-templates";
import type { ComponentDef } from "../site/types";
import { barStateOf, formatActions, patchToOverride, resolveSelection } from "./selection-format";

const def: ComponentDef = {
  id: "c1",
  name: "Tarjeta",
  description: "",
  category: "cards",
  width: 300,
  height: 200,
  links: {},
  custom: true,
  elements: [
    newElement("text", "t1", { text: "Hola", bold: true }),
    newElement("rect", "b1", { text: "Explorar" }),
    newElement("image", "i1"),
  ],
};
const free = { selectedId: "blk", selectedElementId: null };

describe("resolveSelection", () => {
  it("sin sección seleccionada actúa el titular", () => {
    expect(resolveSelection("p", { selectedId: "title", selectedElementId: null }, def, "blk")).toBeNull();
  });

  it("un elemento se rotula con su nombre", () => {
    const result = resolveSelection("p", { ...free, selectedElementId: "b1" }, def, "blk");
    expect(result?.label).toBe("Botón «Explorar»");
    expect(result?.elementIds).toEqual(["b1"]);
  });

  it("varios elementos se cuentan y se aplican todos", () => {
    const result = resolveSelection("p", { ...free, selectedElementId: "t1", alsoSelectedIds: ["b1", "i1"] }, def, "blk");
    expect(result?.label).toBe("3 elementos");
    expect(result?.elementIds).toEqual(["t1", "b1", "i1"]);
  });

  it("una sección entera afecta a sus textos, no a las imágenes", () => {
    const result = resolveSelection("p", free, def, "blk");
    expect(result?.kind).toBe("section");
    expect(result?.elementIds).toEqual(["t1", "b1"]);
  });
});

describe("barStateOf", () => {
  it("negrita solo se enciende si todos la tienen", () => {
    expect(barStateOf([def.elements[0]]).bold).toBe(true);
    expect(barStateOf([def.elements[0], def.elements[1]]).bold).toBe(false);
  });
});

describe("patchToOverride", () => {
  it("convierte la barra al formato de un elemento e ignora lo exclusivo del titular", () => {
    expect(patchToOverride({ size: 20, font: "Georgia", highlight: "#ff0", block: "h2" })).toEqual({
      fontSize: 20,
      fontFamily: "Georgia",
    });
    expect(patchToOverride({ align: "justify" })).toEqual({ align: "left" });
  });
});

describe("formatActions", () => {
  const selection = resolveSelection("p", { ...free, selectedElementId: "t1", alsoSelectedIds: ["b1"] }, def, "blk")!;

  it("en este bloque es una sola acción para todos los elementos", () => {
    expect(formatActions("block", selection, { bold: true })).toEqual([
      { type: "block/style", pageId: "p", blockId: "blk", elementIds: ["t1", "b1"], patch: { bold: true } },
    ]);
  });

  it("en todo el componente es una acción por elemento", () => {
    const actions = formatActions("component", selection, { bold: true });
    expect(actions.map((a) => a.type)).toEqual(["component/element", "component/element"]);
  });

  it("un cambio que no vale para elementos no hace nada", () => {
    expect(formatActions("block", selection, { highlight: "#ff0" })).toEqual([]);
  });
});
