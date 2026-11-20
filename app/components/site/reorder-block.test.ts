import { describe, expect, it } from "vitest";
import { reorderBlock } from "./reorder-block";
import type { BlockInstance } from "./types";

const blocks = ["a", "b", "c", "d"].map((id) => ({ id, componentId: "x" }) as BlockInstance);
const ids = (list: BlockInstance[]) => list.map((b) => b.id).join("");

describe("reorderBlock", () => {
  it("pone el bloque antes del indicado", () => {
    expect(ids(reorderBlock(blocks, "c", "a"))).toBe("cabd");
    expect(ids(reorderBlock(blocks, "a", "d"))).toBe("bcad");
  });
  it("sin destino lo manda al final", () => {
    expect(ids(reorderBlock(blocks, "a", null))).toBe("bcda");
  });
  it("si no cambia nada devuelve la misma lista", () => {
    expect(reorderBlock(blocks, "b", "c")).toBe(blocks);
    expect(reorderBlock(blocks, "d", null)).toBe(blocks);
    expect(reorderBlock(blocks, "zz", "a")).toBe(blocks);
  });
});

describe("reorderBlock con varias", () => {
  it("las mueve juntas y en su orden", () => {
    expect(ids(reorderBlock(blocks, ["a", "c"], "d"))).toBe("bacd");
    expect(ids(reorderBlock(blocks, ["b", "d"], "a"))).toBe("bdac");
    expect(ids(reorderBlock(blocks, ["a", "b"], null))).toBe("cdab");
  });
  it("no se puede soltar sobre una de las movidas", () => {
    expect(reorderBlock(blocks, ["a", "b"], "b")).toBe(blocks);
  });
});

import { dropBlocks } from "./reorder-block";

describe("dropBlocks", () => {
  const withSlot = (id: string, slot?: "header" | "body" | "footer") => ({ id, componentId: "x", ...(slot ? { slot } : {}) }) as BlockInstance;
  const slotOf = (b: BlockInstance) => b.slot ?? "body";

  it("el aviso soltado sobre el encabezado pasa a la zona del encabezado", () => {
    const list = [withSlot("aviso"), withSlot("head", "header"), withSlot("hero")];
    const result = dropBlocks(list, ["aviso"], "head", slotOf);
    expect(result.map((b) => b.id)).toEqual(["aviso", "head", "hero"]);
    expect(result[0].slot).toBe("header");
  });

  it("soltado antes del cuerpo adopta el cuerpo", () => {
    const list = [withSlot("head", "header"), withSlot("aviso", "header"), withSlot("hero")];
    const result = dropBlocks(list, ["aviso"], "hero", slotOf);
    expect(result.find((b) => b.id === "aviso")?.slot).toBe("body");
  });

  it("soltado al final adopta la zona de la última (el pie)", () => {
    const list = [withSlot("a"), withSlot("b"), withSlot("foot", "footer")];
    const result = dropBlocks(list, ["a"], null, slotOf);
    expect(result.at(-1)?.id).toBe("a");
    expect(result.at(-1)?.slot).toBe("footer");
  });

  it("sin cambios devuelve la misma lista", () => {
    const list = [withSlot("a"), withSlot("b")];
    expect(dropBlocks(list, ["a"], "b", slotOf)).toBe(list);
  });
});
