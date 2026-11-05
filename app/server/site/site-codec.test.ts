import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { INITIAL_SITE } from "../../components/site/initial-site";
import type { SiteState } from "../../components/site/types";
import { PARSER_VERSIONS, parseCode, printCode } from "./code-ast";
import { composeSite } from "./compose-site";
import { decomposeSite } from "./decompose-all";
import { SCREEN_KEYS } from "./site-keys";
import { codeKey, type CodeTexts } from "./rows";

/** Pasa por el mismo camino que el guardado: el código se vuelve árbol y se reimprime desde el árbol. */
function roundTrip(state: SiteState): SiteState {
  const { rows, code } = decomposeSite(state);
  const texts: CodeTexts = new Map(
    code.map((draft) => {
      const parsed = parseCode(draft.language, draft.text);
      if (!parsed.ok) throw new Error(`${draft.slot}: ${parsed.error}`);
      return [codeKey(draft.owner, draft.slot), printCode(draft.language, parsed.code.ast)];
    }),
  );
  // El nombre de quien escribió cada comentario lo pone la base de datos al leer (une con los usuarios).
  const authors = new Map((state.comments ?? []).map((comment) => [comment.id, comment.author]));
  return composeSite({ ...rows, comments: rows.comments.map((row) => ({ ...row, author: authors.get(row.id) })) }, texts);
}

const withoutScreen = (state: SiteState) => Object.fromEntries(Object.entries(state).filter(([key]) => !(SCREEN_KEYS as readonly string[]).includes(key)));

/** Un sitio que usa todo lo que tiene su propia tabla. El código ya está en el formato canónico de Babel, así que vuelve idéntico. */
const RICH = {
  navigation: { defaultTransition: { kind: "fade", seconds: 0.4 } },
  currentPageId: "contacto",
  selectedId: "b1",
  selectedElementId: "el1",
  alsoSelectedIds: ["el2"],
  projectMedia: [{ id: "m1", name: "logo", src: "https://x.test/logo.png", kind: "image", createdAt: 1 }],
  globalCss: ".caja {\n  color: red;\n}\n",
  libraries: [{ id: "lib1", name: "gsap", version: "3.12.5", source: "cdn" }],
  variables: [
    { id: "v1", scope: { kind: "global" }, name: "primario", kind: "color", value: "#0d99ff" },
    { id: "v2", scope: { kind: "page", pageId: "contacto" }, name: "gap", kind: "size", value: "12px" },
  ],
  rules: [{ scope: { kind: "component", componentId: "tarjeta" }, target: "heading", props: { color: "var(--primario)" } }],
  functions: [
    { id: "f1", name: "saludar", code: 'function saludar(nombre: string) {\n  return "Hola " + nombre;\n}', scope: { kind: "global" } },
    { id: "f2", name: "abrir", code: "function abrir() {\n  return 1;\n}", scope: { kind: "element", blockId: "b1", elementId: "el1" } },
  ],
  sources: [
    {
      id: "s1",
      name: "Noticias",
      url: "https://api.test/news",
      method: "GET",
      query: [{ key: "q", value: "a" }],
      headers: [{ key: "Authorization", value: "Bearer secreto" }],
      transform: "data => data.articles;",
      cache: { kind: "ttl", seconds: 60 },
    },
  ],
  comments: [{ id: "c1", pageId: "inicio", x: 10, y: 20, text: "Revisar", author: "Ana", at: "2026-11-03T10:00:00.000Z", audience: "team", resolved: true }],
  components: [
    { id: "navbar", name: "Barra", description: "", category: "navegación", width: 1200, height: 80, elements: [{ id: "el1", kind: "text" }], links: { el1: { kind: "page", pageId: "contacto" } }, custom: false },
    {
      id: "tarjeta",
      name: "Tarjeta",
      description: "x",
      category: "contenido",
      width: 300,
      height: 200,
      elements: [],
      links: {},
      custom: true,
      drawn: true,
      styles: { $section: { classes: "p-4", css: ".t {\n  margin: 0;\n}\n" } },
    },
  ],
  pages: [
    {
      id: "inicio",
      name: "Inicio",
      slug: "inicio",
      isHome: true,
      title: { text: "Hola" },
      media: [{ id: "med1", kind: "image", src: "https://x.test/a.png", name: "a.png", embed: false, alt: "", local: true }],
      blocks: [
        {
          id: "b1",
          componentId: "navbar",
          slot: "header",
          locked: true,
          code: { html: '<div class="hero"><b>Hola</b></div>', css: ".hero {\n  color: blue;\n}\n", js: 'console.log("listo");', tailwind: true },
          custom: { $section: { classes: "bg-red", css: "a {\n  color: red;\n}\n" }, el1: { classes: "", css: "" } },
          behaviors: [
            { id: "bh1", scope: "$section", trigger: "click", action: { kind: "code", source: "alert(1);", mode: "page" } },
            { id: "bh2", scope: "el1", trigger: "load", action: { kind: "toast", message: "hi", tone: "info", place: "top", seconds: 2 } },
          ],
          box: { padding: 12 },
        },
      ],
      animations: [{ id: "a1", name: "Entrada", steps: [{ id: "st1", blockId: "b1", key: "$section", prop: "opacity", from: 0, to: 1, at: 0, duration: 400, easing: "ease", iterations: 0, direction: "alternate" }, { id: "st2", blockId: "b1", key: "el1", prop: "fill", from: "#fff", to: "#000", at: 100, duration: 200 }] }],
      css: "body {\n  margin: 0;\n}\n",
      js: "const x = 1;",
      seo: { title: "Inicio" },
    },
    { id: "contacto", name: "Contacto", slug: "contacto", isHome: false, role: "not-found", hidden: true, route: "/c/:id", title: {}, media: [], blocks: [] },
  ],
} as unknown as SiteState;

describe("traductor del sitio (estado ⇄ filas y árboles)", () => {
  it("devuelve el sitio idéntico, salvo lo que es de cada pantalla", () => {
    const back = roundTrip(RICH);
    expect(back).toEqual({ ...withoutScreen(RICH), currentPageId: "inicio", selectedId: "title", selectedElementId: null });
  });

  it("no deja código en las filas: solo en los árboles", () => {
    const { rows } = decomposeSite(RICH);
    const text = JSON.stringify(rows);
    for (const code of ["alert(1)", "margin: 0", "console.log", "saludar(nombre", "data.articles", "color: red"]) expect(text).not.toContain(code);
  });

  it("conserva lo que el editor añada y no tenga tabla propia", () => {
    expect(roundTrip(RICH)).toHaveProperty("projectMedia");
    const extra = { ...RICH, pages: [{ ...RICH.pages[0], algoNuevo: { a: 1 } }, RICH.pages[1]] } as unknown as SiteState;
    expect(roundTrip(extra).pages[0]).toHaveProperty("algoNuevo", { a: 1 });
  });

  it("el sitio de partida del editor sobrevive entero", () => {
    const back = roundTrip(INITIAL_SITE);
    expect(decomposeSite(back).rows).toEqual(decomposeSite(INITIAL_SITE).rows);
    expect(roundTrip(back)).toEqual(back);
  });

  it("el código con errores no se convierte en árbol", () => {
    expect(parseCode("typescript", "function (").ok).toBe(false);
    expect(parseCode("css", ".a { color: ").ok).toBe(false);
  });

  it("el CSS y el HTML vuelven tal cual los escribió la persona", () => {
    const css = "/* nota */\n.a   { color : red;\n  margin:0 }\n@media (min-width: 600px) {\n  .a { margin: 1px !important; }\n}\n";
    const parsedCss = parseCode("css", css);
    expect(parsedCss.ok && printCode("css", parsedCss.code.ast)).toBe(css);
    const html = '<section class="a"><h1>Hola</h1>\n  <p>x <b>y</b></p><!-- n --></section>';
    const parsedHtml = parseCode("html", html);
    expect(parsedHtml.ok && printCode("html", parsedHtml.code.ast)).toBe(html);
  });

  it("los árboles no contienen el texto original (ni posiciones)", () => {
    const parsed = parseCode("typescript", 'const secretoUnico = "valor";');
    expect(parsed.ok && JSON.stringify(parsed.code.ast)).not.toContain("const secretoUnico");
    expect(parsed.ok && parsed.code.ast).not.toHaveProperty("tokens");
    expect(parsed.ok && JSON.stringify(parsed.code.ast)).not.toContain('"loc"');
  });

  it("las versiones de los analizadores guardadas son las instaladas", () => {
    const installed = (name: string) => (JSON.parse(readFileSync(`node_modules/${name}/package.json`, "utf8")) as { version: string }).version;
    expect(PARSER_VERSIONS).toEqual({ babel: installed("@babel/parser"), postcss: installed("postcss"), parse5: installed("parse5") });
  });
});
