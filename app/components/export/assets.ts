import type { CanvasElement, ComponentDef } from "../site/types";

/** Una imagen subida (incrustada en el diseño): no cabe en un prompt, así que se entrega aparte con un nombre. */
export interface ExportAsset {
  name: string;
  dataUrl: string;
}

const EXTENSION = /^data:image\/([a-z0-9+.-]+)/i;
const extensionOf = (dataUrl: string): string => {
  const kind = EXTENSION.exec(dataUrl)?.[1]?.toLowerCase() ?? "png";
  return kind === "jpeg" ? "jpg" : kind === "svg+xml" ? "svg" : kind;
};

/**
 * Cambia las imágenes incrustadas por una ruta (`assets/imagen-1.png`) y devuelve esos archivos aparte.
 * Las que ya son un enlace se dejan como están. Las repetidas comparten el mismo archivo.
 */
export function externalizeAssets(view: ComponentDef): { view: ComponentDef; assets: ExportAsset[] } {
  const byData = new Map<string, ExportAsset>();

  const swap = (value: string | undefined): string | undefined => {
    if (!value?.startsWith("data:")) return value;
    const known = byData.get(value);
    if (known) return `assets/${known.name}`;
    const asset = { name: `imagen-${byData.size + 1}.${extensionOf(value)}`, dataUrl: value };
    byData.set(value, asset);
    return `assets/${asset.name}`;
  };

  const elements = view.elements.map((element): CanvasElement => ({ ...element, src: swap(element.src) ?? "", poster: swap(element.poster) }));
  return { view: { ...view, elements }, assets: [...byData.values()] };
}
