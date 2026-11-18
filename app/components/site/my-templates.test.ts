import { describe, expect, it } from "vitest";
import { myTemplates } from "./my-templates";
import type { ComponentDef } from "./types";

const def = (id: string, extra: Partial<ComponentDef>): ComponentDef =>
  ({ id, name: id, description: "", category: "Código", width: 1, height: 1, elements: [], links: {}, custom: true, ...extra });

describe("myTemplates", () => {
  const all = [
    def("s", { codeKind: "template" }),
    def("s2", { codeKind: "template", templateFor: "section" }),
    def("p", { codeKind: "template", templateFor: "page" }),
    def("c", { codeKind: "component" }),
    def("f", {}),
  ];
  it("las plantillas sin destino son de sección", () => {
    expect(myTemplates(all, "section").map((d) => d.id)).toEqual(["s", "s2"]);
  });
  it("las de página van aparte, y los componentes y de fábrica no cuentan", () => {
    expect(myTemplates(all, "page").map((d) => d.id)).toEqual(["p"]);
  });
});
