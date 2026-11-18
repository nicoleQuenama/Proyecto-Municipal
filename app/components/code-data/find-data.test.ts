import { describe, expect, it } from "vitest";
import { findData } from "./find-data";

const LIST = `const opciones = [
  { name: "inicio", link: "/" }, // la portada
  { name: "leyes", link: "/leyes", },
];
opciones.forEach((o) => console.log(o.name));`;

describe("findData", () => {
  it("detecta una lista recorrida con forEach", () => {
    const [set] = findData(LIST);
    expect(set.name).toBe("opciones");
    expect(set.kind).toBe("list");
    expect(set.rows).toHaveLength(2);
    expect(set.rows[0].cells.map((c) => [c.key, c.value])).toEqual([["name", "inicio"], ["link", "/"]]);
  });

  it("ignora una lista que nunca se recorre", () => {
    expect(findData(`const a = [{ x: "1" }];\nconsole.log(1);`)).toEqual([]);
  });

  it("detecta recorridos con map, for…of e índice", () => {
    const body = `const a = [{ x: "1" }];`;
    expect(findData(`${body} a.map((i) => i.x);`)).toHaveLength(1);
    expect(findData(`${body} for (const i of a) { void i; }`)).toHaveLength(1);
    expect(findData(`${body} void a[0].x;`)).toHaveLength(1);
  });

  it("marca como no editable un valor calculado", () => {
    const [set] = findData(`const a = [{ t: "x" + y, n: 2 }]; a.forEach(() => {});`);
    expect(set.rows[0].cells.map((c) => c.value)).toEqual([null, 2]);
  });

  it("detecta un objeto suelto usado", () => {
    const [set] = findData(`const cfg = { titulo: "Hola", activo: true }; document.title = cfg.titulo;`);
    expect(set.kind).toBe("object");
    expect(set.rows[0].cells.map((c) => c.value)).toEqual(["Hola", true]);
  });

  it("ignora arreglos de valores que no son objetos", () => {
    expect(findData(`const n = [1, 2]; n.forEach(() => {});`)).toEqual([]);
  });

  it("los rangos cubren el literal exacto, con comentarios y comas finales", () => {
    const [set] = findData(LIST);
    const cell = set.rows[1].cells[1];
    expect(LIST.slice(cell.start, cell.end)).toBe(`"/leyes"`);
    expect(LIST.slice(set.start, set.start + 1)).toBe("[");
    expect(LIST[set.end - 1]).toBe("]");
  });

  it("no depende de nombres ni de funciones auxiliares", () => {
    const [set] = findData(`const tarjetas = [{ titulo: 'A', img: 'a.png' }]; tarjetas.map((t) => t.titulo);`);
    expect(set.name).toBe("tarjetas");
    expect(set.rows[0].cells[1].value).toBe("a.png");
  });
});
