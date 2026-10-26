import type { DomMeasures } from "./types";

/** Mide la vista previa dibujada en pantalla: nodos por página y tamaño real frente al mostrado de cada imagen. */
export function measureDom(root: ParentNode = document): DomMeasures {
  const nodes: Record<string, number> = {};
  const images: DomMeasures["images"] = [];

  for (const frame of root.querySelectorAll<HTMLElement>("[data-page-id]")) {
    nodes[frame.dataset.pageId!] = frame.querySelectorAll("*").length;
    for (const img of frame.querySelectorAll("img")) {
      if (img.naturalWidth > 0) images.push({ src: img.currentSrc || img.src, naturalWidth: img.naturalWidth, shownWidth: img.clientWidth });
    }
  }
  return { nodes, images };
}
