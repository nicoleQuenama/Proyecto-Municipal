import { describe, expect, it } from "vitest";
import {
  extractKeywords,
  findMediaUsage,
  matchMediaAsset,
  normalizeTag,
  replaceMediaInSite,
} from "./media-usage";
import { INITIAL_SITE } from "../site/initial-site";
import type { ComponentDef, ProjectMediaAsset, SiteState } from "../site/types";

describe("media-usage: normalización y coincidencia de etiquetas", () => {
  it("normaliza acentos y mayúsculas en etiquetas", () => {
    expect(normalizeTag("Día del Peatón")).toBe("dia del peaton");
    expect(normalizeTag("  Áreas Verdes  ")).toBe("areas verdes");
  });

  it("extrae palabras clave individuales útiles", () => {
    const kw = extractKeywords("Actividad Día del Peatón 2026");
    expect(kw).toContain("actividad");
    expect(kw).toContain("dia");
    expect(kw).toContain("del");
    expect(kw).toContain("peaton");
    expect(kw).toContain("2026");
  });

  it("coincide por término exacto o parcial en nombre o etiquetas", () => {
    const asset: ProjectMediaAsset = {
      id: "m1",
      name: "Foto cierre de avenidas",
      src: "https://ejemplo.com/foto1.jpg",
      kind: "image",
      tag: "Día del Peatón",
      tags: ["movilidad", "centro", "ciclismo"],
      createdAt: Date.now(),
    };

    // Coincide por búsqueda de la etiqueta principal
    expect(matchMediaAsset("peaton", asset)).toBe(true);
    expect(matchMediaAsset("Peatón", asset)).toBe(true);
    expect(matchMediaAsset("dia", asset)).toBe(true);

    // Coincide por búsqueda en tags adicionales
    expect(matchMediaAsset("ciclismo", asset)).toBe(true);
    expect(matchMediaAsset("movil", asset)).toBe(true);

    // Coincide por nombre
    expect(matchMediaAsset("avenidas", asset)).toBe(true);

    // No coincide con término no relacionado
    expect(matchMediaAsset("salud", asset)).toBe(false);
  });
});

describe("media-usage: detección de uso y reemplazo seguro", () => {
  const dummyComp: ComponentDef = {
    id: "banner-comp",
    name: "Banner Principal",
    description: "Cabecera destacada",
    category: "headers",
    width: 1200,
    height: 400,
    links: {},
    custom: true,
    elements: [
      {
        id: "img-1",
        kind: "image",
        role: "none",
        x: 0,
        y: 0,
        width: 1200,
        height: 400,
        src: "https://ejemplo.com/banner-viejo.jpg",
        fill: "",
        radius: 0,
        text: "",
        fontSize: 14,
        color: "",
        bold: false,
        align: "left",
        fontFamily: "",
      },
    ],
  };

  const dummySite: SiteState = {
    ...INITIAL_SITE,
    pages: [
      {
        ...INITIAL_SITE.pages[0],
        id: "inicio",
        name: "Inicio",
        slug: "",
        backdrop: {
          kind: "image",
          src: "https://ejemplo.com/fondo-inicio.jpg",
          fit: "cover",
          anchor: "mc",
          fixed: false,
          blur: 0,
        },
        blocks: [
          {
            id: "b1",
            componentId: "banner-comp",
            elements: {
              "img-1": { src: "https://ejemplo.com/banner-viejo.jpg" },
            },
          },
        ],
        media: [],
      },
      {
        ...INITIAL_SITE.pages[0],
        id: "noticias",
        name: "Noticias",
        slug: "noticias",
        backdrop: undefined,
        blocks: [
          {
            id: "b2",
            componentId: "banner-comp",
            box: {
              backdrop: {
                kind: "image",
                src: "https://ejemplo.com/fondo-inicio.jpg",
                fit: "cover",
                anchor: "mc",
                fixed: false,
                blur: 0,
              },
            },
          },
        ],
        media: [],
      },
    ],
    components: [dummyComp],
  };

  it("encuentra todas las ocurrencias donde se usa una imagen", () => {
    // banner-viejo se usa en el bloque b1 de Inicio y en el bloque b2 de Noticias
    const usages1 = findMediaUsage(dummySite, "https://ejemplo.com/banner-viejo.jpg");
    expect(usages1).toHaveLength(2);
    expect(usages1.some((u) => u.pageId === "inicio" && u.blockId === "b1")).toBe(true);
    expect(usages1.some((u) => u.pageId === "noticias" && u.blockId === "b2")).toBe(true);

    // fondo-inicio se usa como backdrop en Inicio y en el bloque b2 de Noticias
    const usages2 = findMediaUsage(dummySite, "https://ejemplo.com/fondo-inicio.jpg");
    expect(usages2).toHaveLength(2);
    expect(usages2.some((u) => u.type === "page-backdrop" && u.pageId === "inicio")).toBe(true);
    expect(usages2.some((u) => u.type === "block-backdrop" && u.pageId === "noticias")).toBe(true);

    // Imagen sin uso devuelve lista vacía
    const usagesNone = findMediaUsage(dummySite, "https://ejemplo.com/huerfana.jpg");
    expect(usagesNone).toHaveLength(0);
  });

  it("reemplaza la imagen en todas las apariciones del sitio sin romper páginas", () => {
    const updated = replaceMediaInSite(
      dummySite,
      "https://ejemplo.com/banner-viejo.jpg",
      "https://ejemplo.com/banner-nuevo.jpg",
      "Nuevo Banner Peatonal",
    );

    // Verificar que en inicio el bloque fue actualizado
    const inicioBlock = updated.pages.find((p) => p.id === "inicio")?.blocks[0];
    expect(inicioBlock?.elements?.["img-1"]?.src).toBe("https://ejemplo.com/banner-nuevo.jpg");
    expect(inicioBlock?.elements?.["img-1"]?.alt).toBe("Nuevo Banner Peatonal");

    // Verificar que la URL vieja ya no existe en el sitio
    const oldUsages = findMediaUsage(updated, "https://ejemplo.com/banner-viejo.jpg");
    expect(oldUsages).toHaveLength(0);

    // Verificar que la nueva URL ahora se detecta en uso en ambos bloques
    const newUsages = findMediaUsage(updated, "https://ejemplo.com/banner-nuevo.jpg");
    expect(newUsages).toHaveLength(2);
  });
});
