import { describe, expect, it } from "vitest";
import { API_BRIDGE, PAGE_ID_ATTRIBUTE } from "./api-bridge";
import { buildSrcDoc } from "./build-srcdoc";

const shared = { variables: [], globalCss: "", functions: [] };
const code = { html: "<p>hola</p>", css: "", js: "api.log(1);", tailwind: true };

describe("PAGE_ID_ATTRIBUTE", () => {
  it("convierte el selector de una página concreta en uno que vale para cualquiera", () => {
    expect('[data-page-id="inicio"] [data-site-page]'.replace(PAGE_ID_ATTRIBUTE, "[data-page-id]")).toBe("[data-page-id] [data-site-page]");
    expect("[data-page-id='x'] p".replace(PAGE_ID_ATTRIBUTE, "[data-page-id]")).toBe("[data-page-id] p");
  });
});

describe("el documento de un bloque de código", () => {
  const doc = buildSrcDoc(code, [], "http://localhost:3000", shared);

  it("define api antes del código del usuario", () => {
    expect(doc).toContain(API_BRIDGE);
    expect(doc.indexOf(API_BRIDGE)).toBeLessThan(doc.indexOf('<script type="module">'));
  });

  it("marca el body como la página y la raíz como su marco, para que los selectores de página lo encuentren", () => {
    expect(doc).toContain("<html data-page-id>");
    expect(doc).toContain("<body data-site-page>");
  });
});

describe("la captura de un bloque", () => {
  it("el documento atiende el pedido de captura y carga la librería desde el mismo origen", () => {
    const doc = buildSrcDoc(code, [], "http://localhost:3000", shared);
    expect(doc).toContain("portal:capture");
    expect(doc).toContain("portal:captured");
    expect(doc).toContain("http://localhost:3000/api/vendor/html-to-image");
  });
});
