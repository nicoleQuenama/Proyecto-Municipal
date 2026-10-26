import { describe, expect, it } from "vitest";
import { siteReducer } from "../site/site-reducer";
import { addNoopener, stripDebug, unsafeNewTabLinks } from "./code-fixes";
import { addFontDisplay, fontsWithoutDisplay } from "./fonts";
import { auditPage } from "./run-audit";
import { el, siteWith, withTitleBlock } from "./test-site";
import type { Finding } from "./types";

type Site = ReturnType<typeof siteWith>;
const run = (site: Site) => auditPage(site, site.pages[0].id);
const ids = (site: Site) => run(site).findings.map((f) => f.ruleId);
const find = (site: Site, ruleId: string): Finding => run(site).findings.find((f) => f.ruleId === ruleId)!;
const applyFix = (site: Site, finding: Finding, text?: string, index = 0): Site =>
  finding.fixes[index].build(text).reduce(siteReducer, site);

const GOOD_DESCRIPTION = "Información del municipio, trámites en línea, servicios y contacto para vecinos.";
const LINK_EXTERNAL = { kind: "external" as const, url: "https://a.test", newTab: true };

describe("accesibilidad", () => {
  it("avisa de imágenes sin alt y se arregla con texto o como decorativa", () => {
    const site = siteWith([el({ id: "i", kind: "image", src: "https://x.test/a.webp?w=400" })]);
    const found = find(site, "a11y-image-alt");
    expect(found).toBeDefined();
    expect(ids(applyFix(site, found, "Plaza principal"))).not.toContain("a11y-image-alt");
    expect(ids(applyFix(site, found, undefined, 1))).not.toContain("a11y-image-alt");
  });

  it("no avisa si la imagen ya tiene alt", () => {
    const site = siteWith([el({ id: "i", kind: "image", src: "https://x.test/a.webp?w=400", alt: "Plaza" })]);
    expect(ids(site)).not.toContain("a11y-image-alt");
  });

  it("detecta bajo contraste y lo arregla", () => {
    const site = siteWith([el({ id: "t", text: "Hola", color: "#cccccc" })]);
    const found = find(site, "a11y-contrast");
    expect(found).toBeDefined();
    expect(ids(applyFix(site, found))).not.toContain("a11y-contrast");
  });

  it("usa el fondo de la forma que cubre el texto", () => {
    const dark = siteWith([el({ id: "r", kind: "rect", fill: "#000000" }), el({ id: "t", text: "Hola", color: "#ffffff" })]);
    expect(ids(dark)).not.toContain("a11y-contrast");
    const clash = siteWith([el({ id: "r", kind: "rect", fill: "#000000" }), el({ id: "t", text: "Hola", color: "#111111" })]);
    expect(ids(clash)).toContain("a11y-contrast");
  });

  it("detecta texto pequeño y lo agranda", () => {
    const site = siteWith([el({ id: "t", text: "chico", fontSize: 9 })]);
    expect(ids(applyFix(site, find(site, "a11y-small-text")))).not.toContain("a11y-small-text");
  });

  it("detecta enlaces sin texto y objetivos táctiles pequeños", () => {
    const site = siteWith([el({ id: "e", kind: "rect", width: 30, height: 30 })], { e: LINK_EXTERNAL });
    expect(ids(site)).toEqual(expect.arrayContaining(["a11y-link-name", "a11y-touch-target"]));
    expect(ids(applyFix(site, find(site, "a11y-touch-target")))).not.toContain("a11y-touch-target");
  });

  it("avisa si los títulos saltan de nivel y si falta el idioma", () => {
    const site = siteWith([el({ id: "t", text: "Sub", role: "heading" })]);
    expect(ids(withTitleBlock(site, "h1"))).not.toContain("a11y-heading-order");
    expect(ids(site)).not.toContain("a11y-heading-order");
    const code = { id: "b2", componentId: "c1", code: { html: "<h4>x</h4>", css: "", js: "", tailwind: false } };
    const jump = { ...site, pages: [{ ...site.pages[0], blocks: [...site.pages[0].blocks, code] }, ...site.pages.slice(1)] };
    expect(ids(jump)).toContain("a11y-heading-order");
    expect(ids(site)).toContain("a11y-lang");
  });
});

describe("SEO", () => {
  it("pide título y descripción, y se arreglan", () => {
    let site = siteWith([]);
    expect(ids(site)).toEqual(expect.arrayContaining(["seo-title", "seo-description"]));
    site = applyFix(site, find(site, "seo-title"), "Inicio · Portal");
    site = applyFix(site, find(site, "seo-description"), GOOD_DESCRIPTION);
    expect(ids(site)).not.toContain("seo-title");
    expect(ids(site)).not.toContain("seo-description");
  });

  it("exige una sola H1", () => {
    const none = withTitleBlock(siteWith([]), "h2");
    expect(ids(none)).toContain("seo-h1");
    expect(ids(applyFix(none, find(none, "seo-h1")))).not.toContain("seo-h1");
    expect(ids(siteWith([]))).not.toContain("seo-h1");
  });

  it("detecta enlaces a páginas eliminadas", () => {
    const site = siteWith([el({ id: "e", text: "Ir" })], { e: { kind: "page", pageId: "no-existe" } });
    expect(ids(applyFix(site, find(site, "seo-broken-links")))).not.toContain("seo-broken-links");
  });
});

describe("rendimiento y buenas prácticas", () => {
  it("avisa de imágenes subidas muy pesadas", () => {
    const big = `data:image/png;base64,${"A".repeat(500_000)}`;
    expect(ids(siteWith([el({ id: "i", kind: "image", src: big, alt: "x" })]))).toContain("perf-image-size");
  });

  it("avisa de imágenes remotas sin tamaño y no de las reducidas", () => {
    expect(ids(siteWith([el({ id: "i", kind: "image", src: "https://x.test/foto.jpg", alt: "x" })]))).toContain("perf-image-size");
    expect(ids(siteWith([el({ id: "i", kind: "image", src: "https://x.test/foto.jpg?w=600", alt: "x" })]))).not.toContain("perf-image-size");
  });

  it("detecta http:// y lo corrige en enlaces", () => {
    const site = siteWith([el({ id: "e", text: "Ir" })], { e: { kind: "external", url: "http://a.test", newTab: false } });
    expect(ids(applyFix(site, find(site, "bp-https")))).not.toContain("bp-https");
  });

  it("detecta librerías pesadas y las quita", () => {
    const site = { ...siteWith([]), libraries: [{ id: "l1", name: "moment", version: "2", source: "cdn" as const }] };
    expect(applyFix(site, find(site, "perf-libraries")).libraries).toHaveLength(0);
  });

  it("repara font-display, rel=noopener y console", () => {
    const css = "@font-face { font-family: A; src: url(a.woff2); }";
    expect(fontsWithoutDisplay(css)).toBe(1);
    expect(fontsWithoutDisplay(addFontDisplay(css))).toBe(0);
    expect(fontsWithoutDisplay(addFontDisplay("@import url('https://fonts.googleapis.com/css2?family=Roboto');"))).toBe(0);
    expect(unsafeNewTabLinks(addNoopener('<a href="x" target="_blank">a</a>'))).toBe(0);
    expect(stripDebug("let a = 1;\nconsole.log(a);\nlet b = 2;")).toBe("let a = 1;\nlet b = 2;");
  });

  it("una página limpia saca 100 en todo", () => {
    const site = siteWith([el({ id: "t", text: "Hola mundo" })]);
    const seo = { title: "Inicio", description: GOOD_DESCRIPTION, lang: "es", image: "https://x.test/og.jpg" };
    const clean = { ...site, pages: [{ ...site.pages[0], seo }, ...site.pages.slice(1)] };
    expect(run(clean).scores).toEqual({ performance: 100, accessibility: 100, "best-practices": 100, seo: 100 });
  });
});
