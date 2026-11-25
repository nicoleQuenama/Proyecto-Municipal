import { describe, expect, it } from "vitest";
import { matchMediaAsset } from "./media-usage";
import type { ProjectMediaAsset } from "../site/types";

describe("MediaPicker logic", () => {
  const assets: ProjectMediaAsset[] = [
    {
      id: "1",
      name: "Alcaldía Fachada Central",
      src: "https://ejemplo.com/alcaldia.jpg",
      kind: "image",
      tag: "Institucional",
      tags: ["fachada", "centro"],
      createdAt: 1000,
    },
    {
      id: "2",
      name: "Avenida Blanco Galindo Asfaltado",
      src: "https://ejemplo.com/obras.jpg",
      kind: "image",
      tag: "Obras",
      tags: ["asfalto", "vialidad"],
      createdAt: 2000,
    },
    {
      id: "3",
      name: "Spot de Recaudaciones",
      src: "https://ejemplo.com/video.mp4",
      kind: "video",
      tag: "Trámites",
      createdAt: 3000,
    },
  ];

  it("filtra por tipo de medio (imagen vs video)", () => {
    const imagesOnly = assets.filter((a) => a.kind === "image");
    expect(imagesOnly.length).toBe(2);

    const videosOnly = assets.filter((a) => a.kind === "video");
    expect(videosOnly.length).toBe(1);
    expect(videosOnly[0].name).toBe("Spot de Recaudaciones");
  });

  it("filtra por etiqueta municipal seleccionada", () => {
    const selectedTag = "Obras";
    const filtered = assets.filter(
      (a) => a.tag?.toLowerCase() === selectedTag.toLowerCase()
    );
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe("2");
  });

  it("busca por coincidencia de texto en nombre y etiquetas", () => {
    const query = "asfalt";
    const matches = assets.filter((a) => matchMediaAsset(query, a));
    expect(matches.length).toBe(1);
    expect(matches[0].name).toContain("Blanco Galindo");
  });

  it("recupera lista única de etiquetas registradas", () => {
    const set = new Set<string>();
    for (const item of assets) {
      if (item.tag?.trim()) set.add(item.tag.trim());
      if (item.tags) {
        for (const t of item.tags) {
          if (t?.trim()) set.add(t.trim());
        }
      }
    }
    const tags = Array.from(set);
    expect(tags).toContain("Institucional");
    expect(tags).toContain("Obras");
    expect(tags).toContain("Trámites");
    expect(tags).toContain("fachada");
  });
});
