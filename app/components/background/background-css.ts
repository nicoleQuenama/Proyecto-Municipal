/** Del modelo de fondo al CSS y a los atributos del video (lógica pura, sin React). */

import type { CSSProperties } from "react";
import type { Anchor, BackgroundFit, BlockBackground, BoxSpan } from "./types";

export const DEFAULT_BACKGROUND: Omit<BlockBackground, "kind" | "src"> = {
  fit: "cover",
  anchor: "mc",
  fixed: false,
  blur: 0,
};

/** Posición CSS de cada punto de anclaje. */
export const ANCHOR_CSS: Record<Anchor, string> = {
  tl: "left top",
  tc: "center top",
  tr: "right top",
  ml: "left center",
  mc: "center center",
  mr: "right center",
  bl: "left bottom",
  bc: "center bottom",
  br: "right bottom",
};

export const ANCHORS = Object.keys(ANCHOR_CSS) as Anchor[];

/** Cómo se ajusta la imagen (`background-size` y repetición). */
const FIT_CSS: Record<BackgroundFit, Pick<CSSProperties, "backgroundSize" | "backgroundRepeat">> = {
  cover: { backgroundSize: "cover", backgroundRepeat: "no-repeat" },
  contain: { backgroundSize: "contain", backgroundRepeat: "no-repeat" },
  repeat: { backgroundSize: "auto", backgroundRepeat: "repeat" },
};

/** Cómo se ajusta el video (`object-fit`); «repetir» no existe en un video y equivale a cubrir. */
const VIDEO_FIT: Record<BackgroundFit, CSSProperties["objectFit"]> = { cover: "cover", contain: "contain", repeat: "cover" };

/** Cuánto ocupa una sección y cómo se coloca su contenido dentro. */
const SPAN_CSS: Record<BoxSpan, CSSProperties> = {
  content: {},
  width: { display: "flex", justifyContent: "center", alignItems: "center", width: "100%" },
  screen: { display: "flex", justifyContent: "center", alignItems: "center", width: "100%", minHeight: "100vh" },
};

export const spanStyle = (span: BoxSpan | undefined): CSSProperties => SPAN_CSS[span ?? "content"];

/** ¿La sección se estira a todo el ancho de la página? */
export const stretches = (span: BoxSpan | undefined): boolean => (span ?? "content") !== "content";

/** El desenfoque deja bordes claros; se agranda la capa un poco para esconderlos. */
const blurStyle = (blur: number): CSSProperties =>
  blur > 0 ? { filter: `blur(${blur}px)`, transform: "scale(1.08)" } : {};

/** La capa de imagen (también la portada de un video). */
export function imageLayerStyle(bg: BlockBackground, src: string): CSSProperties {
  return {
    backgroundImage: `url("${src.replace(/"/g, "%22")}")`,
    backgroundPosition: ANCHOR_CSS[bg.anchor],
    backgroundAttachment: bg.fixed ? "fixed" : "scroll",
    ...FIT_CSS[bg.fit],
    ...blurStyle(bg.blur),
  };
}

/** Un archivo de video: llena el fondo según el ajuste y el punto de anclaje. */
export const videoLayerStyle = (bg: BlockBackground): CSSProperties => ({
  width: "100%",
  height: "100%",
  objectFit: VIDEO_FIT[bg.fit],
  objectPosition: ANCHOR_CSS[bg.anchor],
  ...blurStyle(bg.blur),
});

/** Un reproductor incrustado: se agranda para cubrir como un fondo (16:9 centrado). */
export const embedLayerStyle = (bg: BlockBackground): CSSProperties => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  width: "max(100%, calc(100cqh * 16 / 9))",
  height: "max(100%, calc(100cqw * 9 / 16))",
  transform: `translate(-50%, -50%)${bg.blur > 0 ? " scale(1.08)" : ""}`,
  filter: bg.blur > 0 ? `blur(${bg.blur}px)` : undefined,
  border: 0,
  pointerEvents: "none",
});

/** El velo de color con su opacidad. */
export const veilStyle = (bg: BlockBackground): CSSProperties | null =>
  bg.veil && bg.veil.opacity > 0 ? { background: bg.veil.color, opacity: Math.min(100, bg.veil.opacity) / 100 } : null;

const YOUTUBE_EMBED = /\/embed\/([\w-]{11})/;

/** El reproductor incrustado en modo fondo: sin sonido, en bucle y sin controles. */
export function embedBackgroundUrl(src: string): string {
  try {
    const url = new URL(src);
    const params = url.searchParams;
    if (url.hostname.includes("youtube")) {
      const id = url.pathname.match(YOUTUBE_EMBED)?.[1];
      for (const [key, value] of Object.entries({ autoplay: "1", mute: "1", loop: "1", controls: "0", playsinline: "1" })) params.set(key, value);
      if (id) params.set("playlist", id);
    } else {
      for (const [key, value] of Object.entries({ background: "1", autoplay: "1", muted: "1", loop: "1" })) params.set(key, value);
    }
    return url.href;
  } catch {
    return src;
  }
}

/** Una imagen sin nada que mostrar (sin dirección) no cuenta como fondo. */
export const hasBackground = (bg: BlockBackground | undefined): bg is BlockBackground =>
  bg !== undefined && bg.src.trim() !== "";
