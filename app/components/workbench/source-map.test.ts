import { describe, expect, it } from "vitest";
import { buildSourceMap, nodeAtLine, selectorAtLine } from "./source-map";

describe("buildSourceMap", () => {
  const html = [
    "<section>",
    '  <h1 class="titulo">Hola</h1>',
    "  <p>",
    "    Texto con <strong>fuerza</strong>",
    "  </p>",
    "</section>",
  ].join("\n");

  it("ubica cada elemento por su ruta y sus líneas", () => {
    const map = buildSourceMap(html);
    expect(map.byPath.get("0")?.tagName).toBe("section");
    expect(map.byPath.get("0")?.startLine).toBe(1);
    expect(map.byPath.get("0,0")?.tagName).toBe("h1");
    expect(map.byPath.get("0,0")?.startLine).toBe(2);
    expect(map.byPath.get("0,1,0")?.tagName).toBe("strong");
    expect(map.byPath.get("0,1,0")?.startLine).toBe(4);
  });

  it("elige el elemento más interno de una línea", () => {
    const map = buildSourceMap(html);
    expect(nodeAtLine(map, 2)?.tagName).toBe("h1");
    expect(nodeAtLine(map, 4)?.tagName).toBe("strong");
    expect(nodeAtLine(map, 6)?.tagName).toBe("section");
    expect(nodeAtLine(map, 99)).toBeNull();
  });

  it("no falla con HTML vacío ni roto", () => {
    expect(buildSourceMap("").nodes).toHaveLength(0);
    expect(() => buildSourceMap("<div><span>")).not.toThrow();
  });
});

describe("selectorAtLine", () => {
  const css = [
    ".card {",
    "  color: red;",
    "}",
    "",
    "@media (max-width: 600px) {",
    "  .card:hover {",
    "    color: blue;",
    "  }",
    "}",
  ].join("\n");

  it("devuelve la regla que contiene la línea", () => {
    expect(selectorAtLine(css, 1)).toBe(".card");
    expect(selectorAtLine(css, 2)).toBe(".card");
    expect(selectorAtLine(css, 6)).toBe(".card:hover");
    expect(selectorAtLine(css, 7)).toBe(".card:hover");
  });

  it("no inventa selectores para líneas sueltas", () => {
    expect(selectorAtLine(css, 3)).toBeNull();
    expect(selectorAtLine(css, 4)).toBeNull();
    expect(selectorAtLine(css, 99)).toBeNull();
  });
});
