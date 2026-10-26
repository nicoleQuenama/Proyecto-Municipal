"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSiteDispatch } from "../site/site-context";
import { TopLayer } from "../ui/top-layer";
import { useDismiss } from "../ui/use-dismiss";
import { parsePosterUrl, posterFileProblem, providerThumbnail } from "./poster";
import type { MediaItem } from "./types";

const WIDTH = 288;
const MARGIN = 8;

const buttonClass = "h-8 rounded-md bg-hover px-2.5 text-left text-xs hover:bg-accent hover:text-white";

interface PosterMenuProps {
  item: MediaItem;
  pageId: string;
  point: { x: number; y: number };
  onClose: () => void;
}

/** El menú de clic derecho de un video: elegir, cambiar o quitar su portada. */
export function PosterMenu({ item, pageId, point, onClose }: PosterMenuProps) {
  const dispatch = useSiteDispatch();
  const ref = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  useDismiss(ref, true, onClose);

  const thumbnail = providerThumbnail(item);

  /** Cambia la portada; si la anterior era un archivo local, se libera. */
  const apply = (poster: string | null, local = false) => {
    if (item.posterLocal && item.poster) URL.revokeObjectURL(item.poster);
    dispatch({ type: "media/poster", pageId, mediaId: item.id, poster, local });
    onClose();
  };

  const pickFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const problem = posterFileProblem(file);
      if (problem) return setError(problem);
      apply(URL.createObjectURL(file), true);
    };
    input.click();
  };

  const applyUrl = () => {
    const parsed = parsePosterUrl(url);
    if (!parsed.ok) return setError(parsed.error);
    apply(parsed.value);
  };

  const left = Math.max(MARGIN, Math.min(point.x, window.innerWidth - WIDTH - MARGIN));
  const top = Math.max(MARGIN, Math.min(point.y, window.innerHeight - 340));

  // En un portal al <body>: el lienzo tiene zoom y un menú dentro de él se vería encogido y desplazado.
  return createPortal(
    <TopLayer
      ref={ref}
      role="menu"
      aria-label={`Portada de ${item.name}`}
      className="fixed flex flex-col gap-2 rounded-xl border border-line bg-panel p-3 text-ink shadow-2xl"
      style={{ left, top, width: WIDTH }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <p className="truncate text-xs font-medium">Portada · {item.name}</p>

      {item.poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.poster} alt="Portada actual" className="aspect-video w-full rounded-md bg-canvas object-cover" />
      )}

      <button type="button" onClick={pickFile} className={buttonClass}>
        Subir una imagen…
      </button>

      {thumbnail && (
        <button type="button" onClick={() => apply(thumbnail)} className={buttonClass}>
          Usar la miniatura de YouTube
        </button>
      )}

      <div className="flex gap-1.5">
        <input
          aria-label="URL de la imagen de portada"
          placeholder="https://… (imagen)"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && applyUrl()}
          className="h-8 min-w-0 flex-1 rounded-md border border-line bg-canvas px-2 text-xs outline-none focus:border-accent"
        />
        <button type="button" onClick={applyUrl} className="h-8 shrink-0 rounded-md bg-accent px-3 text-xs text-white hover:opacity-90">
          Usar
        </button>
      </div>

      {item.poster && (
        <button type="button" onClick={() => apply(null)} className="h-8 rounded-md px-2.5 text-left text-xs text-red-400 hover:bg-red-500/15">
          Quitar la portada
        </button>
      )}
      {error && <p role="alert" className="text-[11px] text-red-400">{error}</p>}
    </TopLayer>,
    document.body,
  );
}
