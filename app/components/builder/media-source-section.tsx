"use client";

import { useRef, useState } from "react";
import type { CanvasElement } from "../site/types";
import { MediaOptions } from "./media-options";
import { isMediaKind, patchFromFile, patchFromUrl } from "./media-patch";
import { actionButton, inputClass } from "./panel-fields";
import { useFileDrop } from "./use-file-drop";

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
  const kind = isMediaKind(element.kind) ? element.kind : "image";
  const copy = COPY[kind];

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

  const drop = useFileDrop((file) => void applyFile(file));
  const preview = kind === "image" ? element.src : element.poster;

  return (
    <section aria-label={copy.title} className="flex flex-col gap-2 border-t border-line pt-3">
      <h4 className="text-[11px] font-semibold tracking-wider text-ink-dim uppercase">{copy.title}</h4>

      <div
        {...drop.handlers}
        className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed p-2 text-center text-[11px] text-ink-dim ${
          drop.over ? "border-accent bg-accent/10" : "border-line"
        }`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Vista previa" className="max-h-24 max-w-full rounded object-contain" />
        ) : (
          <span>{kind === "video" && element.src ? "Video enlazado (sin portada)" : copy.empty}</span>
        )}
        <button type="button" className={`${actionButton} w-full`} onClick={() => fileInput.current?.click()}>
          {copy.upload}
        </button>
        <span>o arrastra un archivo hasta aquí</span>
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

      <div className="flex gap-1">
        <input
          type="url"
          aria-label={`Enlace de ${copy.title.toLowerCase()}`}
          placeholder={copy.url}
          value={draft}
          aria-invalid={error !== null}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyUrl()}
          className={inputClass}
        />
        <button type="button" className={actionButton} onClick={applyUrl}>
          Usar
        </button>
      </div>
      {element.src && !element.src.startsWith("data:") && (
        <span className="truncate text-[11px] text-ink-dim" title={element.src}>{element.src}</span>
      )}
      {error && <span role="alert" className="text-[11px] text-red-400">{error}</span>}

      <MediaOptions element={element} kind={kind} onChange={onChange} />
    </section>
  );
}
