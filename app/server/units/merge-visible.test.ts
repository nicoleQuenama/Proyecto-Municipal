import { describe, expect, it } from "vitest";
import { VersionError } from "../versions/branch-rows";
import { mergeVisibleSlice } from "./merge-visible";

interface Item {
  id: string;
  unit: string | null;
  value: number;
}
const full: Item[] = [
  { id: "a", unit: "u1", value: 1 },
  { id: "b", unit: "u2", value: 2 },
  { id: "c", unit: null, value: 3 },
];
const mine = ["u1"];
const rules = {
  key: (item: Item) => item.id,
  visible: (item: Item) => item.unit === null || mine.includes(item.unit),
  editable: (item: Item) => item.unit !== null && mine.includes(item.unit),
};
const merge = (submitted: Item[]) => mergeVisibleSlice(full, submitted, rules);

describe("mergeVisibleSlice", () => {
  it("conserva lo que la persona no ve cuando guarda lo suyo", () => {
    expect(merge([{ id: "a", unit: "u1", value: 9 }, { id: "c", unit: null, value: 3 }])).toEqual([
      { id: "a", unit: "u1", value: 9 },
      { id: "b", unit: "u2", value: 2 },
      { id: "c", unit: null, value: 3 },
    ]);
  });

  it("rechaza cambiar algo visible pero de solo lectura", () => {
    expect(() => merge([{ id: "a", unit: "u1", value: 1 }, { id: "c", unit: null, value: 99 }])).toThrow(VersionError);
  });

  it("rechaza quitar algo de solo lectura", () => {
    expect(() => merge([{ id: "a", unit: "u1", value: 1 }])).toThrow(VersionError);
  });

  it("permite quitar lo propio", () => {
    expect(merge([{ id: "c", unit: null, value: 3 }]).map((item) => item.id)).toEqual(["b", "c"]);
  });

  it("agrega lo nuevo propio al final", () => {
    expect(merge([...full.filter(rules.visible), { id: "d", unit: "u1", value: 4 }]).map((item) => item.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("rechaza crear algo en una unidad ajena", () => {
    expect(() => merge([...full.filter(rules.visible), { id: "e", unit: "u2", value: 5 }])).toThrow(VersionError);
  });

  it("rechaza enviar algo invisible que no existía o que cambió", () => {
    expect(() => merge([...full.filter(rules.visible), { id: "b", unit: "u2", value: 22 }])).toThrow(VersionError);
  });
});
