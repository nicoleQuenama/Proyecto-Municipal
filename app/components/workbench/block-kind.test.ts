import { describe, expect, it } from "vitest";
import type { BlockInstance, CodeSource, ComponentDef, Page } from "../site/types";
import { KIND_LABELS, kindOf, usesOf } from "./block-kind";

const CODE: CodeSource = { tailwind: false, html: "", css: "", js: "" };
const def = (id: string, codeKind?: "component" | "template"): ComponentDef =>
  ({ id, name: id, description: "", category: "code", width: 1, height: 1, elements: [], links: {}, custom: true, code: CODE, codeKind });
const block = (componentId: string, code?: CodeSource): BlockInstance => ({ id: "b", componentId, code });

describe("kindOf", () => {
  it("suelto, componente y plantilla", () => {
    expect(kindOf(block("code-block", CODE), [])).toBe("loose");
    expect(kindOf(block("c"), [def("c", "component")])).toBe("component");
    expect(kindOf(block("t", CODE), [def("t", "template")])).toBe("template");
  });
  it("todos los tipos tienen nombre", () => {
    expect(Object.values(KIND_LABELS)).toEqual(["Suelto", "Componente", "Plantilla"]);
  });
});

describe("usesOf", () => {
  it("cuenta los bloques que usan la definición en todas las páginas", () => {
    const page = (blocks: BlockInstance[]) => ({ blocks }) as Page;
    expect(usesOf("c", [page([block("c"), block("x")]), page([block("c")])])).toBe(2);
  });
});
