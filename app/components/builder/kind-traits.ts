import type { ElementKind } from "../site/types";

/** Qué propiedades tiene cada tipo de elemento en el panel del constructor. */
interface KindTraits {
  label: string;
  /** Color de relleno. */
  hasFill: boolean;
  /** Texto, tamaño de letra, color y alineación. */
  hasText: boolean;
  hasRadius: boolean;
  /** Se le pone una imagen o un video (subir, URL). */
  hasMedia: boolean;
  /** Se elige de un conjunto de íconos: ícono, color, tamaño y grosor. */
  hasIcon?: boolean;
}

/** Un tipo nuevo de elemento es una entrada nueva aquí. */
export const KIND_TRAITS: Record<ElementKind, KindTraits> = {
  rect: { label: "Rectángulo", hasFill: true, hasText: true, hasRadius: true, hasMedia: false },
  ellipse: { label: "Elipse", hasFill: true, hasText: true, hasRadius: false, hasMedia: false },
  triangle: { label: "Triángulo", hasFill: true, hasText: false, hasRadius: false, hasMedia: false },
  line: { label: "Línea", hasFill: true, hasText: false, hasRadius: false, hasMedia: false },
  text: { label: "Texto", hasFill: false, hasText: true, hasRadius: false, hasMedia: false },
  image: { label: "Imagen", hasFill: false, hasText: false, hasRadius: true, hasMedia: true },
  icon: { label: "Ícono", hasFill: false, hasText: false, hasRadius: false, hasMedia: false, hasIcon: true },
  video: { label: "Video", hasFill: false, hasText: false, hasRadius: true, hasMedia: true },
};
