"use client";

import { useRef, useState } from "react";
import { imageFileProblem, readAsDataUrl } from "../media/image-file";
import { parseImageUrl, parseVideoUrl, type ParseResult, type ParsedMedia } from "../media/media-url";
import type { CanvasElement } from "../site/types";
import { actionButton, Field, inputClass } from "./panel-fields";

/** Lo que cambia en un elemento al ponerle una imagen o un video. */
type MediaPatch = Pick<CanvasElement, "kind" | "src" | "embed">;

const toPatch = ({ kind, src, embed }: ParsedMedia): MediaPatch => ({ kind, src, embed });

/** Las fuentes por URL: qué se pide y cómo se valida. Una fuente nueva es una entrada nueva. */
const URL_SOURCES = {
  image: { button: "Imagen URL", label: "URL de la imagen", parse: parseImageUrl },
  video: { button: "Video URL", label: "URL del video (YouTube, Vimeo o archivo)", parse: parseVideoUrl },
} satisfies Record<string, { button: string; label: string; parse: (input: string) => ParseResult<ParsedMedia> }>;

type UrlSource = keyof typeof URL_SOURCES;

interface MediaSourceSectionProps {
  onChange: (patch: MediaPatch) => void;
}

/** De dónde sale la imagen o el video de un elemento: subir un archivo, o una URL de imagen o de video. */
export function MediaSourceSection({ onChange }: MediaSourceSectionProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<UrlSource | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const chooseFile = async (file: File | undefined) => {
    if (!file) return;
    const problem = imageFileProblem(file);
    if (problem) return setError(problem);

    try {
      onChange({ kind: "image", src: await readAsDataUrl(file), embed: false });
      setError(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "No se pudo leer el archivo.");
    }
  };

  const applyUrl = (chosen: UrlSource) => {
    const result = URL_SOURCES[chosen].parse(draft);
    if (!result.ok) return setError(result.error);

    onChange(toPatch(result.value));
    setError(null);
    setDraft("");
    setSource(null);
  };

  const openUrl = (chosen: UrlSource) => {
    setSource(source === chosen ? null : chosen);
    setError(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] text-ink-dim">Contenido</span>

      <div className="grid grid-cols-3 gap-1">
        <button type="button" className={actionButton} onClick={() => fileInput.current?.click()}>
          Subir
        </button>
        {(Object.keys(URL_SOURCES) as UrlSource[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={source === key}
            className={`${actionButton} ${source === key ? "border-accent" : ""}`}
            onClick={() => openUrl(key)}
          >
            {URL_SOURCES[key].button}
          </button>
        ))}
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void chooseFile(e.target.files?.[0]);
          e.target.value = ""; // permite volver a elegir el mismo archivo
        }}
      />

      {source && (
        <Field label={URL_SOURCES[source].label}>
          <input
            type="url"
            autoFocus
            placeholder="https://…"
            value={draft}
            aria-invalid={error !== null}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyUrl(source)}
            className={inputClass}
          />
          <button type="button" className={actionButton} onClick={() => applyUrl(source)}>
            Aplicar
          </button>
        </Field>
      )}

      {error && <span role="alert" className="text-[11px] text-red-400">{error}</span>}
    </div>
  );
}
