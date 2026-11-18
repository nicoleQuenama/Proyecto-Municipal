import { describe, expect, it } from "vitest";
import type { CodeSource } from "../site/types";
import { findCodeColors, recolorCode } from "./code-colors";
import { TAILWIND_PALETTE } from "./tailwind-palette";

const code = (parts: Partial<CodeSource>): CodeSource => ({ html: "", css: "", js: "", tailwind: true, ...parts });
const values = (c: CodeSource) => findCodeColors(c).map((g) => g.value);

describe("findCodeColors", () => {
  it("detecta colores hexadecimales en el CSS, el HTML y el TypeScript", () => {
    const found = values(code({ css: "p { color: #ff0000; }", html: '<div style="background:#00F"></div>', js: 'el.style.color = "#123456";' }));
    expect(found).toEqual(["#ff0000", "#0000ff", "#123456"]);
  });

  it("detecta rgb() y rgba()", () => {
    expect(values(code({ css: "a { color: rgb(255, 0, 0); background: rgba(0 128 0 / 0.5); }" }))).toEqual(["#ff0000", "#008000"]);
  });

  it("detecta las clases de la paleta de Tailwind y las une con el mismo color escrito en hex", () => {
    const groups = findCodeColors(code({ js: 'header.className = "bg-sky-900 text-white hover:bg-sky-800";', css: "a { color: #024a70; }" }));
    expect(groups.map((g) => g.value)).toEqual(["#024a70", "#ffffff", TAILWIND_PALETTE["sky-800"]]);
    expect(groups[0].matches).toHaveLength(2);
  });

  it("detecta los colores escritos entre corchetes en Tailwind", () => {
    expect(values(code({ html: '<p class="bg-[#0b1026] text-[#fff]/80"></p>' }))).toEqual(["#0b1026", "#ffffff"]);
  });

  it("no confunde un ancla (#faq, &#9776;) ni palabras con un color", () => {
    expect(values(code({ html: '<a href="#faq">x</a> &#9776; <p class="bg-sky-950x"></p>', js: "const id = '#main';" }))).toEqual([]);
  });

  it("sin colores devuelve una lista vacía", () => {
    expect(findCodeColors(code({ html: "<p>hola</p>" }))).toEqual([]);
  });
});

describe("recolorCode", () => {
  it("cambia todas las apariciones de un color, en todos los archivos, y deja lo demás igual", () => {
    const before = code({ css: "p { color: #ff0000; margin: 0 }", html: '<i style="color:#F00"></i>', js: 'const c = "#00ff00";' });
    const after = recolorCode(before, "#ff0000", "#0000ff");
    expect(after.css).toBe("p { color: #0000ff; margin: 0 }");
    expect(after.html).toBe('<i style="color:#0000ff"></i>');
    expect(after.js).toBe(before.js);
  });

  it("una clase de la paleta pasa a un color entre corchetes y conserva la opacidad", () => {
    const after = recolorCode(code({ html: '<p class="hover:bg-sky-900/50 text-white"></p>' }), "#024a70", "#ff0000");
    expect(after.html).toBe('<p class="hover:bg-[#ff0000]/50 text-white"></p>');
  });

  it("rgba() conserva su transparencia", () => {
    expect(recolorCode(code({ css: "a { color: rgba(255, 0, 0, 0.5); }" }), "#ff0000", "#0000ff").css).toBe("a { color: rgba(0, 0, 255, 0.5); }");
  });

  it("un hexadecimal con transparencia la conserva", () => {
    expect(recolorCode(code({ css: "a { color: #ff000080; }" }), "#ff0000", "#00ff00").css).toBe("a { color: #00ff0080; }");
  });

  it("si el color nuevo es el mismo no cambia nada", () => {
    const before = code({ css: "a { color: #ff0000; }" });
    expect(recolorCode(before, "#ff0000", "#ff0000")).toBe(before);
  });
});
