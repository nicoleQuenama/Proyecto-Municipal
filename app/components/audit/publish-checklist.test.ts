import { describe, expect, it } from "vitest";
import { PUBLISH_CHECKLIST, checklistText, verifyPublishedHtml } from "./publish-checklist";

const GOOD = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Inicio</title>
<meta name="description" content="Información del municipio, trámites en línea, servicios y contacto para vecinos.">
<link rel="canonical" href="https://x.test/"><style>body{margin:0}</style></head>
<body><h1>Hola</h1><img src="a.webp" alt="Plaza" width="10" height="10"><img src="b.webp" alt="" width="10" height="10" loading="lazy">
<a href="https://y.test" target="_blank" rel="noopener noreferrer">y</a></body></html>`;

describe("lista de publicación", () => {
  it("un HTML correcto cumple todo", () => {
    expect(verifyPublishedHtml(GOOD).filter((r) => !r.ok)).toEqual([]);
  });

  it("detecta lo que falta", () => {
    const bad = verifyPublishedHtml("<html><head></head><body><h1>a</h1><h1>b</h1><img src='x'></body></html>");
    const failed = bad.filter((r) => !r.ok).map((r) => r.id);
    expect(failed).toEqual(expect.arrayContaining(["doctype", "viewport", "lang", "title", "description", "single-h1", "img-alt"]));
  });

  it("se puede copiar como texto", () => {
    expect(checklistText().split("\n")).toHaveLength(PUBLISH_CHECKLIST.length + 1);
  });
});
