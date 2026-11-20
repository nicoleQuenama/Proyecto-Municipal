import { describe, expect, it } from "vitest";
import { dropTarget } from "./drop-target";

const list = [
  { id: "a", top: 0, bottom: 100 },
  { id: "b", top: 100, bottom: 300 },
  { id: "c", top: 300, bottom: 400 },
];

describe("dropTarget", () => {
  it("cae antes de la primera sección cuyo centro queda por debajo", () => {
    expect(dropTarget(list, 20)).toEqual({ beforeId: "a", lineY: 0 });
    expect(dropTarget(list, 120)).toEqual({ beforeId: "b", lineY: 100 });
    expect(dropTarget(list, 250)).toEqual({ beforeId: "c", lineY: 300 });
  });
  it("pasado el centro de la última va al final", () => {
    expect(dropTarget(list, 380)).toEqual({ beforeId: null, lineY: 400 });
  });
  it("sin hermanas va al final en el puntero", () => {
    expect(dropTarget([], 50)).toEqual({ beforeId: null, lineY: 50 });
  });
});
