import { describe, expect, it } from "vitest";
import { CODE_COMPONENT_ID } from "../site/code-defaults";
import { INITIAL_SITE } from "../site/initial-site";
import { siteReducer } from "../site/site-reducer";
import type { SiteState } from "../site/types";
import { FILE_KINDS } from "./file-ref";

const codeDef = { id: CODE_COMPONENT_ID, name: "Código", description: "", category: "code", width: 800, height: 400, elements: [], links: {}, custom: false };

function site(kind?: "component" | "template"): SiteState {
  let s: SiteState = { ...INITIAL_SITE, pages: [], components: [...INITIAL_SITE.components, codeDef] };
  s = siteReducer(s, { type: "page/create", id: "p1", name: "Uno" });
  s = siteReducer(s, { type: "block/add", id: "b1", pageId: "p1", componentId: CODE_COMPONENT_ID });
  s = siteReducer(s, { type: "block/code", pageId: "p1", blockId: "b1", patch: { js: "const a = 1;" } });
  return kind ? siteReducer(s, { type: "block/set-kind", pageId: "p1", blockId: "b1", kind, name: "X", thumbnail: "https://ik.test/t.png" }) : s;
}
const ref = { kind: "block-js" as const, pageId: "p1", blockId: "b1" };

describe("archivos de un bloque de código", () => {
  it("un componente compartido se lee y se escribe en su definición", () => {
    const s = site("component");
    expect(FILE_KINDS["block-js"].read(s, ref)).toBe("const a = 1;");
    expect(FILE_KINDS["block-js"].write(s, ref, "x")).toMatchObject({ type: "component/code", patch: { js: "x" } });
  });

  it.each([undefined, "template" as const])("un bloque suelto o plantilla escribe en su propio código (%s)", (kind) => {
    const s = site(kind);
    expect(FILE_KINDS["block-js"].read(s, ref)).toBe("const a = 1;");
    expect(FILE_KINDS["block-js"].write(s, ref, "x")).toMatchObject({ type: "block/code", patch: { js: "x" } });
  });
});
