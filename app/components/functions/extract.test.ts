import { describe, expect, it } from "vitest";
import { declaredName, extractFunction } from "./scope";

describe("extractFunction", () => {
  it("respeta una declaración completa con el mismo nombre", () => {
    expect(extractFunction("function suma(a, b) {\n  return a + b;\n}", "suma")).toEqual({ code: "function suma(a, b) {\n  return a + b;\n}", call: "" });
  });

  it("solo cambia el nombre si se pide otro, sin envolverla", () => {
    const result = extractFunction("function suma(a, b) {\n  return a + b;\n}", "sumar");
    expect(result.code).toBe("function sumar(a, b) {\n  return a + b;\n}");
    expect(result.call).toBe("");
  });

  it("reconoce funciones flecha, async, export y comentarios delante", () => {
    expect(declaredName("const doble = (n: number) => n * 2;")).toBe("doble");
    expect(declaredName("const f = async x => x")).toBe("f");
    expect(declaredName("// suma\nexport async function suma() {}")).toBe("suma");
    expect(extractFunction("export const doble = (n) => n * 2;", "doble")).toEqual({ code: "const doble = (n) => n * 2;", call: "" });
  });

  it("envuelve el código suelto y deja la llamada", () => {
    expect(extractFunction("console.log(1);", "hola")).toEqual({ code: "function hola() {\n  console.log(1);\n}", call: "hola();" });
  });
});
