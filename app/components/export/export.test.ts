import { describe, expect, it } from "vitest";
import type { BlockInstance, CanvasElement, ComponentDef } from "../site/types";
import { externalizeAssets } from "./assets";
import { buildPrompt } from "./prompt";
import { buildReference } from "./reference";
import { TOOLS, TOOL_IDS } from "./skills";
import { buildSpec } from "./spec";

const element = (extra: Partial<CanvasElement>): CanvasElement =>
  ({
    id: "e", kind: "text", role: "none", x: 0, y: 0, width: 100, height: 40, fill: "#111111", radius: 0, text: "", fontSize: 16,
    color: "#ffffff", bold: false, align: "left", fontFamily: "Inter", src: "", ...extra,
  }) as CanvasElement;

const view: ComponentDef = {
  id: "hero", name: "Portada", description: "", category: "hero", width: 1024, height: 400, custom: true,
  links: { boton: { kind: "page", pageId: "contacto" } },
  elements: [
    element({ id: "panel", kind: "rect", width: 1024, height: 400, fill: "#0b071c" }),
    element({ id: "titulo", text: "Hola <mundo>", x: 40, y: 60, fontSize: 48, bold: true, name: "Titular" }),
    element({ id: "boton", kind: "rect", text: "Contactar", x: 40, y: 200, width: 160, height: 48, radius: 8, fill: "#ff3366" }),
    element({ id: "foto", kind: "image", src: "data:image/jpeg;base64,AAAA", alt: "Equipo", x: 600, y: 40, width: 380, height: 320 }),
  ],
};
const block = { id: "b", componentId: "hero", behaviors: [{ id: "x", scope: "boton", trigger: "hover", action: { kind: "animate", effect: "pulse", seconds: 0.4 } }] } as BlockInstance;
const context = { pageName: (id: string) => (id === "contacto" ? "Contacto" : id), sourceName: () => "API", sourcePath: (_: string, path: string) => `«API» › ${path}` };

describe("externalizeAssets", () => {
  it("saca las imágenes incrustadas y deja un nombre de archivo", () => {
    const { view: clean, assets } = externalizeAssets(view);
    expect(assets).toEqual([{ name: "imagen-1.jpg", dataUrl: "data:image/jpeg;base64,AAAA" }]);
    expect(clean.elements.find((e) => e.id === "foto")?.src).toBe("assets/imagen-1.jpg");
  });
});

describe("buildSpec", () => {
  const spec = buildSpec({ view: externalizeAssets(view).view, block, pageName: "Inicio", variables: [], context });

  it("incluye el tamaño, los textos y los enlaces con nombres de página", () => {
    expect(spec).toContain("# Sección «Portada»");
    expect(spec).toContain("1024×400px");
    expect(spec).toContain("Hola <mundo>");
    expect(spec).toContain("lleva a la página «Contacto»");
  });

  it("anida los elementos que están dentro de un panel", () => {
    expect(spec).toMatch(/- rectángulo, relleno #0b071c.*\n {2}- \*\*Titular\*\*/);
  });

  it("cuenta las interacciones y no menciona las imágenes incrustadas", () => {
    expect(spec).toContain("al pasar el cursor: animación «pulse» de 0.4s");
    expect(spec).not.toContain("base64");
  });
});

describe("buildReference", () => {
  const { html, css } = buildReference(externalizeAssets(view).view);

  it("coloca cada elemento donde está y escapa el texto", () => {
    expect(css).toContain("left:40px;top:60px");
    expect(html).toContain("Hola &lt;mundo&gt;");
    expect(html).toContain('src="assets/imagen-1.jpg"');
  });

  it("no incluye los elementos ocultos", () => {
    const hidden = buildReference({ ...view, elements: [element({ id: "x", text: "secreto", hidden: true })] });
    expect(hidden.html).not.toContain("secreto");
  });
});

describe("buildPrompt y skills", () => {
  const input = { spec: "# Sección", reference: { html: "<section/>", css: ".a{}" }, assets: ["imagen-1.jpg"] };

  it("sin skill incluye las reglas; con skill, el mensaje es corto y la nombra", () => {
    const full = buildPrompt({ ...input, installed: null });
    const short = buildPrompt({ ...input, installed: "claude-code" });
    expect(full).toContain("inspecciona el proyecto");
    expect(short).not.toContain("inspecciona el proyecto");
    expect(short).toContain("skill «cms-design»");
    expect(full).toContain("imagen-1.jpg");
  });

  it("cada herramienta tiene su formato y su archivo", () => {
    expect(TOOLS["claude-code"].content.startsWith("---\nname: cms-design")).toBe(true);
    expect(TOOLS["claude-code"].path).toBe(".claude/skills/cms-design/SKILL.md");
    expect(TOOLS.agents.path).toBe("AGENTS.md");
    expect(TOOL_IDS).toHaveLength(3);
  });
});
