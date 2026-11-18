import { describe, expect, it } from "vitest";
import { findData } from "./find-data";
import { applyChange } from "./rewrite-value";

const SRC = `const o = [
  { name: "inicio", n: 1, on: true }, // portada
  { name: 'leyes', n: 2, on: false },
];
o.forEach(() => {});`;

const cellValue = (code: string, row: number, key: string) => findData(code)[0].rows[row].cells.find((c) => c.key === key)?.value;

describe("applyChange · set", () => {
  it("cambia solo ese valor y deja el resto igual", () => {
    const out = applyChange(SRC, { type: "set", set: 0, row: 0, key: "name", value: "casa" });
    expect(out).toBe(SRC.replace('"inicio"', '"casa"'));
  });

  it("conserva el tipo de comilla", () => {
    expect(applyChange(SRC, { type: "set", set: 0, row: 1, key: "name", value: "x" })).toContain("name: 'x'");
  });

  it.each(['di"jo', "it's", "a\\b", "línea1\nlínea2", "`${x}`"])("ida y vuelta con %j", (text) => {
    for (const row of [0, 1]) {
      expect(cellValue(applyChange(SRC, { type: "set", set: 0, row, key: "name", value: text }), row, "name")).toBe(text);
    }
  });

  it("número y booleano", () => {
    const out = applyChange(SRC, { type: "set", set: 0, row: 0, key: "n", value: 9 });
    expect(cellValue(applyChange(out, { type: "set", set: 0, row: 0, key: "on", value: false }), 0, "on")).toBe(false);
    expect(cellValue(out, 0, "n")).toBe(9);
  });

  it("no toca una celda calculada", () => {
    const code = `const a = [{ t: x + 1 }]; a.map(() => 0);`;
    expect(applyChange(code, { type: "set", set: 0, row: 0, key: "t", value: "z" })).toBe(code);
  });
});

describe("applyChange · filas", () => {
  it("agrega una fila con las mismas claves y valores vacíos", () => {
    const out = applyChange(SRC, { type: "add-row", set: 0 });
    const rows = findData(out)[0].rows;
    expect(rows).toHaveLength(3);
    expect(rows[2].cells.map((c) => [c.key, c.value])).toEqual([["name", ""], ["n", 0], ["on", false]]);
  });

  it("quita la primera, la última y deja válido el código", () => {
    const first = applyChange(SRC, { type: "remove-row", set: 0, row: 0 });
    expect(cellValue(first, 0, "name")).toBe("leyes");
    expect(first).not.toContain("portada");
    const last = applyChange(SRC, { type: "remove-row", set: 0, row: 1 });
    expect(findData(last)[0].rows).toHaveLength(1);
    expect(cellValue(last, 0, "name")).toBe("inicio");
    expect(last).toContain("// portada");
  });

  it("quitar la única fila deja un arreglo vacío válido", () => {
    const one = `const a = [\n  { x: 1 },\n];\na.map(() => 0);`;
    const out = applyChange(one, { type: "remove-row", set: 0, row: 0 });
    expect(out).toBe(`const a = [\n  \n];\na.map(() => 0);`);
  });

  it("reordena filas", () => {
    const out = applyChange(SRC, { type: "move-row", set: 0, row: 0, to: 1 });
    expect([cellValue(out, 0, "name"), cellValue(out, 1, "name")]).toEqual(["leyes", "inicio"]);
  });
});
