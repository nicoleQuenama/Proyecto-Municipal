"use client";

import { useSyncExternalStore } from "react";
import { embedBackgroundUrl, embedLayerStyle, imageLayerStyle, veilStyle, videoLayerStyle } from "./background-css";
import type { BlockBackground } from "./types";

const QUERY = "(prefers-reduced-motion: reduce)";

const subscribe = (notify: () => void) => {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};

/** ¿La persona pidió menos movimiento? Entonces un video de fondo no se reproduce. */
const useReducedMotion = () =>
  useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);

/** El contenido del fondo: imagen, video (o su portada) según corresponda. */
function Media({ bg, still }: { bg: BlockBackground; still: boolean }) {
  if (bg.kind === "image") return <div className="absolute inset-0" style={imageLayerStyle(bg, bg.src)} />;
  if (still) return bg.poster ? <div className="absolute inset-0" style={imageLayerStyle(bg, bg.poster)} /> : null;
  if (bg.embed) return <iframe aria-hidden tabIndex={-1} title="Video de fondo" src={embedBackgroundUrl(bg.src)} allow="autoplay" style={embedLayerStyle(bg)} />;
  return (
    <video aria-hidden autoPlay muted loop playsInline poster={bg.poster} src={bg.src} className="absolute inset-0" style={videoLayerStyle(bg)} />
  );
}

/**
 * Las capas de un fondo (imagen o video y velo), detrás del contenido. El contenedor que las recibe debe ser
 * `position: relative` con `isolation: isolate`; el recorte de lo desenfocado se queda dentro de las capas.
 */
export function BackgroundLayers({ bg }: { bg: BlockBackground }) {
  const still = useReducedMotion();
  const veil = veilStyle(bg);

  return (
    <div
      aria-hidden
      data-background-layers
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      style={{ borderRadius: "inherit", containerType: "size" }}
    >
      <Media bg={bg} still={still} />
      {veil && <div data-background-veil className="absolute inset-0" style={veil} />}
    </div>
  );
}
