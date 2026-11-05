import { describe, expect, it } from "vitest";
import { diffSite } from "../../components/persistence/site-diff";
import { INITIAL_SITE } from "../../components/site/initial-site";
import type { SiteState } from "../../components/site/types";
import { SCREEN_KEYS } from "./site-keys";
import { applyPatchToSite } from "./site-apply";
import { conflictKey, mergeSites } from "./site-merge";
import { decodeSite, encodeSite } from "./snapshot-codec";

const withoutScreen = (state: SiteState) => Object.fromEntries(Object.entries(state).filter(([key]) => !(SCREEN_KEYS as readonly string[]).includes(key)));
const page = (id: string, extra: Record<string, unknown> = {}) => ({ id, name: id, slug: id, isHome: false, title: { text: id }, media: [], blocks: [], ...extra }) as unknown as SiteState["pages"][number];
const edit = (site: SiteState, change: Partial<SiteState>): SiteState => ({ ...site, ...change });

describe("fotos del sitio", () => {
  it("guardan y devuelven el sitio, con el código como árboles", () => {
    const { document, rejectedCode } = encodeSite(INITIAL_SITE);
    expect(rejectedCode).toEqual([]);
    expect(JSON.stringify(document)).not.toContain("parentNode");
    expect(withoutScreen(decodeSite(JSON.parse(JSON.stringify(document))))).toEqual(withoutScreen(decodeSite(document)));
  });

  it("rechazan código con errores de sintaxis en vez de guardarlo como texto", () => {
    const broken = edit(INITIAL_SITE, { globalCss: "a { color: ", functions: [{ id: "f1", name: "x", code: "function (", scope: { kind: "global" } }] as SiteState["functions"] });
    const { rejectedCode } = encodeSite(broken);
    expect(rejectedCode.length).toBeGreaterThan(0);
  });

  it("cifran las cabeceras de las APIs", () => {
    const source = { id: "s1", name: "api", url: "https://x.test", method: "GET", query: [], headers: [{ key: "Authorization", value: "secreto-123" }], cache: { kind: "none", seconds: 0 }, transform: "" };
    const site = edit(INITIAL_SITE, { sources: [source] as unknown as SiteState["sources"] });
    const { document } = encodeSite(site);
    expect(JSON.stringify(document)).not.toContain("secreto-123");
    expect(decodeSite(document).sources[0].headers).toEqual(source.headers);
  });
});

describe("aplicar un parche", () => {
  it("deja el sitio como el que lo produjo", () => {
    const before = INITIAL_SITE;
    const after = edit(before, {
      pages: [...before.pages.map((p, index) => (index === 0 ? { ...p, name: "Cambiada" } : p)), page("nueva")],
      globalCss: "body {\n  margin: 0;\n}\n",
    });
    const patch = diffSite(before, after)!;
    expect(applyPatchToSite(before, patch)).toEqual(after);
  });

  it("respeta lo que quitó y el orden", () => {
    const before = edit(INITIAL_SITE, { pages: [page("a"), page("b"), page("c")] });
    const after = edit(before, { pages: [page("c"), page("a")] });
    expect(applyPatchToSite(before, diffSite(before, after)!).pages.map((p) => p.id)).toEqual(["c", "a"]);
  });
});

describe("fusionar tres vías", () => {
  const base = edit(INITIAL_SITE, { pages: [page("a"), page("b")], globalCss: "" });

  it("junta lo que cada rama cambió en cosas distintas", () => {
    const into = edit(base, { pages: [{ ...base.pages[0], name: "A de destino" }, base.pages[1]] });
    const from = edit(base, { pages: [base.pages[0], { ...base.pages[1], name: "B de origen" }, page("c")], globalCss: "p {}\n" });
    const { merged, conflicts } = mergeSites(base, into, from);
    expect(conflicts).toEqual([]);
    expect(merged.pages.map((p) => p.name)).toEqual(["A de destino", "B de origen", "c"]);
    expect(merged.globalCss).toBe("p {}\n");
  });

  it("une lo que se cambió dentro de la misma página si no se pisa", () => {
    const into = edit(base, { pages: [{ ...base.pages[0], name: "Nombre nuevo" }, base.pages[1]] });
    const from = edit(base, { pages: [{ ...base.pages[0], slug: "otra-ruta" }, base.pages[1]] });
    const { merged, conflicts } = mergeSites(base, into, from);
    expect(conflicts).toEqual([]);
    expect(merged.pages[0]).toMatchObject({ name: "Nombre nuevo", slug: "otra-ruta" });
  });

  it("marca como conflicto lo que las dos ramas cambiaron distinto, y se resuelve", () => {
    const into = edit(base, { pages: [{ ...base.pages[0], name: "Destino" }, base.pages[1]] });
    const from = edit(base, { pages: [{ ...base.pages[0], name: "Origen" }, base.pages[1]] });

    const open = mergeSites(base, into, from);
    expect(open.conflicts).toHaveLength(1);
    expect(open.conflicts[0]).toMatchObject({ node: "pages/a", property: "name", resolution: null, into: "Destino", from: "Origen" });
    expect(open.merged.pages[0].name).toBe("Destino");

    const resolved = mergeSites(base, into, from, new Map([[conflictKey("pages/a", "name"), "from" as const]]));
    expect(resolved.merged.pages[0].name).toBe("Origen");
    expect(resolved.conflicts[0].resolution).toBe("from");
  });

  it("borrar en una rama y modificar en la otra es conflicto; borrar sin que el otro toque, no", () => {
    const deleted = edit(base, { pages: [base.pages[1]] });
    const touched = edit(base, { pages: [{ ...base.pages[0], name: "Tocada" }, base.pages[1]] });
    expect(mergeSites(base, deleted, touched).conflicts).toHaveLength(1);
    expect(mergeSites(base, deleted, base).merged.pages.map((p) => p.id)).toEqual(["b"]);
    expect(mergeSites(base, base, deleted).merged.pages.map((p) => p.id)).toEqual(["b"]);
  });
});
