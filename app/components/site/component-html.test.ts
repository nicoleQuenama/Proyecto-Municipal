import { describe, expect, it } from "vitest";
import { componentHtml } from "./component-html";
import { newElement } from "./component-templates";
import { SECTION_KEY, type ComponentDef } from "./types";

const def = (extra: Partial<ComponentDef>): ComponentDef => ({
  id: "card", name: "Tarjeta", description: "", category: "cards", width: 280, height: 320, elements: [], links: {}, custom: true, ...extra,
});

describe("componentHtml", () => {
  it("reproduce cada pieza en su posición, con su tamaño y su texto", () => {
    const title = newElement("text", "t", { x: 12, y: 150, width: 250, height: 40, text: "Rendición <Pública>", role: "heading" });
    const html = componentHtml(def({ elements: [title] }));

    expect(html).toContain("width:280px;height:320px");
    expect(html).toContain("<h2");
    expect(html).toContain("left:12px;top:150px;width:250px;height:40px");
    expect(html).toContain("Rendición &lt;Pública&gt;");
  });

  it("una imagen con archivo es un <img> y un botón es un <button>", () => {
    const image = newElement("image", "i", { src: "/a.png", alt: "Foto" });
    const button = newElement("rect", "b", { text: "Abrir →", role: "button" });
    const html = componentHtml(def({ elements: [image, button] }));

    expect(html).toContain('<img src="/a.png" alt="Foto"');
    expect(html).toContain('<button type="button"');
  });

  it("omite lo oculto y no inventa contenido", () => {
    const hidden = newElement("text", "h", { text: "secreto", hidden: true });
    expect(componentHtml(def({ elements: [hidden] }))).not.toContain("secreto");
  });

  it("en una sección en flujo, lo acoplado va dentro de su tarjeta y no a posición fija", () => {
    const card = newElement("rect", "c", { width: 200, height: 100 });
    const inner = newElement("text", "n", { text: "Dentro", parentId: "c" });
    const html = componentHtml(def({ elements: [card, inner], styles: { [SECTION_KEY]: { classes: "flex gap-4", css: "" } } }));

    expect(html).not.toContain("position:absolute");
    expect(html.indexOf("Dentro")).toBeGreaterThan(html.indexOf("<div"));
    expect(html.match(/<p/g)).toHaveLength(1);
  });
});
