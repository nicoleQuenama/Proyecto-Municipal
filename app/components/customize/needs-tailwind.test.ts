import { describe, expect, it } from "vitest";
import type { ComponentDef, Page } from "../site/types";
import { needsTailwind } from "./needs-tailwind";

const page = (extra: Partial<Page>): Page => ({ id: "p", blocks: [], ...extra }) as Page;
const def = (classes: string): ComponentDef => ({ styles: { section: { classes, css: "" } } }) as unknown as ComponentDef;

describe("needsTailwind", () => {
  it("no hace falta sin clases propias ni código de página", () => {
    expect(needsTailwind([page({})], [def("")])).toBe(false);
    expect(needsTailwind([page({ js: "   " })], [])).toBe(false);
  });
  it("hace falta si algún componente o bloque tiene clases", () => {
    expect(needsTailwind([page({})], [def("p-4")])).toBe(true);
    expect(needsTailwind([page({ blocks: [{ id: "b", componentId: "c", custom: { section: { classes: "p-4", css: "" } } }] })], [])).toBe(true);
  });
  it("hace falta si el código de una página crea elementos (puede usar clases de Tailwind)", () => {
    expect(needsTailwind([page({ js: "document.body.className = 'bg-sky-900';" })], [])).toBe(true);
  });
});
