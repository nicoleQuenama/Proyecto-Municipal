"use client";

import { useRef, useState, type DragEvent } from "react";
import type { CanvasElement } from "../site/types";
import { MediaOptions } from "./media-options";
import { isMediaKind, patchFromFile, patchFromUrl } from "./media-patch";
import { actionButton, inputClass } from "./panel-fields";
import { useFileDrop } from "./use-file-drop";
import { MediaPickerModal } from "../media/media-picker-modal";

/** Textos de la sección por tipo: título, qué se sube y ejemplo de enlace. */
const COPY = {
  image: { title: "Imagen", empty: "Haz clic o suelta una imagen", upload: "Subir imagen", url: "https://…/foto.jpg" },
  video: { title: "Video", empty: "Pega un enlace de YouTube, Vimeo o archivo", upload: "Subir portada", url: "https://youtu.be/…" },
} as const;

interface MediaSourceSectionProps {
  element: CanvasElement;
  onChange: (patch: Partial<CanvasElement>) => void;
}

/** La imagen o el video de un elemento: vista previa, subir o soltar un archivo, pegar un enlace y sus opciones. */
export function MediaSourceSection({ element, onChange }: MediaSourceSectionProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [urlDropOver, setUrlDropOver] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const kind = isMediaKind(element.kind) ? element.kind : "image";
  const isFrame = Boolean(element.frame || element.kind === "rect" || element.kind === "ellipse");
  const copy = isFrame
    ? { title: "Marco de Imagen / Foto", empty: "Suelta una imagen sobre este marco", upload: "Subir foto al marco", url: "https://…/foto.jpg" }
    : COPY[kind];

  const applyFile = async (file: File | undefined) => {
    if (!file) return;
    const result = await patchFromFile(kind, file);
    setError(result.ok ? null : result.error);
    if (result.ok) onChange(result.value);
  };

  const applyUrl = () => {
    const result = patchFromUrl(kind, draft);
    setError(result.ok ? null : result.error);
    if (!result.ok) return;
    onChange(result.value);
    setDraft("");
  };

  const handleUrlDragOver = (e: DragEvent) => {
    const types = Array.from(e.dataTransfer.types);
    if (
      types.includes("Files") ||
      types.includes("application/x-cms-media") ||
      types.includes("text/uri-list") ||
      types.includes("text/plain")
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
      setUrlDropOver(true);
    }
  };

  const handleUrlDrop = async (e: DragEvent) => {
    setUrlDropOver(false);
    e.preventDefault();
    e.stopPropagation();

    const mediaUri =
      e.dataTransfer.getData("application/x-cms-media") ||
      e.dataTransfer.getData("text/uri-list") ||
      e.dataTransfer.getData("text/plain");

    if (
      mediaUri &&
      (mediaUri.startsWith("http://") ||
        mediaUri.startsWith("https://") ||
        mediaUri.startsWith("/") ||
        mediaUri.startsWith("data:"))
    ) {
      const result = patchFromUrl(kind, mediaUri.trim());
      setError(result.ok ? null : result.error);
      if (result.ok) {
        onChange(result.value);
        setDraft("");
      }
      return;
    }

    const file = e.dataTransfer.files[0];
    if (file) {
      await applyFile(file);
    }
  };

  const drop = useFileDrop((file) => void applyFile(file));
  const preview = kind === "image" || isFrame ? element.src : element.poster;

  return (
    <section aria-label={copy.title} className="flex flex-col gap-2 border-t border-line pt-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold tracking-wider text-ink-dim uppercase">{copy.title}</h4>
        {preview && (
          <button
            type="button"
            onClick={() => onChange({ src: "" })}
            className="text-[10px] text-red-400 hover:text-red-300 hover:underline cursor-pointer"
          >
            Quitar foto
          </button>
        )}
      </div>

      <div
        {...drop.handlers}
        className={`flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed p-2.5 text-center text-[11px] text-ink-dim transition-colors ${
          drop.over ? "border-accent bg-accent/15" : "border-line bg-canvas/40"
        }`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Vista previa" className="max-h-24 max-w-full rounded object-cover shadow-xs" />
        ) : (
          <span>{kind === "video" && element.src ? "Video enlazado (sin portada)" : copy.empty}</span>
        )}
        <div className="flex w-full flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="w-full rounded-md bg-accent px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-accent/90 active:scale-95 transition-all cursor-pointer"
          >
            Elegir de la biblioteca municipal
          </button>
          <button
            type="button"
            className={`${actionButton} w-full cursor-pointer font-medium text-[11px]`}
            onClick={() => fileInput.current?.click()}
          >
            {copy.upload}
          </button>
        </div>
        <span className="text-[10px]">o arrastra un archivo sobre este cuadro</span>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void applyFile(e.target.files?.[0]);
          e.target.value = ""; // permite volver a elegir el mismo archivo
        }}
      />

      {/* Opción secundaria para URLs externas */}
      <div className="flex flex-col gap-1 text-[11px]">
        {!showManualUrl ? (
          <button
            type="button"
            onClick={() => setShowManualUrl(true)}
            className="text-left text-[10px] text-ink-dim hover:text-accent underline cursor-pointer"
          >
            Ingresar enlace URL externo (avanzado)
          </button>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] text-ink-dim">
              <span>URL directa</span>
              <button
                type="button"
                onClick={() => setShowManualUrl(false)}
                className="hover:text-ink cursor-pointer"
              >
                Ocultar
              </button>
            </div>
            <div
              onDragOver={handleUrlDragOver}
              onDragLeave={() => setUrlDropOver(false)}
              onDrop={handleUrlDrop}
              className={`flex gap-1 rounded transition-colors ${urlDropOver ? "ring-2 ring-accent bg-accent/10" : ""}`}
            >
              <input
                type="url"
                aria-label={`Enlace de ${copy.title.toLowerCase()}`}
                placeholder={urlDropOver ? "Suelta la imagen o enlace aqui..." : copy.url}
                value={draft}
                aria-invalid={error !== null}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyUrl()}
                className={`${inputClass} flex-1 text-xs`}
              />
              <button type="button" className={`${actionButton} cursor-pointer text-xs`} onClick={applyUrl}>
                Usar
              </button>
            </div>
          </div>
        )}
      </div>

      {element.src && !element.src.startsWith("data:") && (
        <span className="truncate text-[10px] text-ink-dim" title={element.src}>{element.src}</span>
      )}
      {error && <span role="alert" className="text-[11px] text-red-400">{error}</span>}

      <MediaOptions element={element} kind={kind} onChange={onChange} />

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(asset) => onChange({ src: asset.src, alt: asset.name })}
        currentSrc={element.src}
        title="Biblioteca de Medios Municipales"
      />
    </section>
  );
}
