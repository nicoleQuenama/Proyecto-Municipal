"use client";

import { useRef, useState } from "react";
import { imageFileProblem, readAsDataUrl } from "../media/image-file";
import { parseImageUrl, parseVideoUrl, type ParseResult, type ParsedMedia } from "../media/media-url";

export interface PickedMedia {
  kind: "image" | "video";
  src: string;
  embed: boolean;
}

/** Las fuentes por URL: qué se pide y cómo se valida. */
const URL_SOURCES = {
  image: { button: "Imagen por URL", label: "URL de la imagen", parse: parseImageUrl },
  video: { button: "Video por URL", label: "URL del video (mp4, webm, YouTube o Vimeo)", parse: parseVideoUrl },
} satisfies Record<string, { button: string; label: string; parse: (input: string) => ParseResult<ParsedMedia> }>;

type UrlSource = keyof typeof URL_SOURCES;

const button = "h-8 rounded-md border border-line px-2 text-xs hover:bg-hover";

/** De dónde sale el fondo: subir una imagen del equipo, o una URL de imagen o de video. */
export function BackgroundSource({ onPick }: { onPick: (media: PickedMedia) => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<UrlSource | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const chooseFile = async (file: File | undefined) => {
    if (!file) return;
    const problem = imageFileProblem(file);
    if (problem) return setError(problem);
    try {
      onPick({ kind: "image", src: await readAsDataUrl(file), embed: false });
      setError(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "No se pudo leer el archivo.");
    }
  };

  const applyUrl = (chosen: UrlSource) => {
    const result = URL_SOURCES[chosen].parse(draft);
    if (!result.ok) return setError(result.error);
    const { kind, src, embed } = result.value;
    onPick({ kind, src, embed });
    setError(null);
    setDraft("");
    setSource(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] text-ink-dim">Imagen o video de fondo</span>
      <div className="grid grid-cols-3 gap-1">
        <button type="button" className={button} onClick={() => fileInput.current?.click()}>Subir imagen</button>
        {(Object.keys(URL_SOURCES) as UrlSource[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={source === key}
            className={`${button} ${source === key ? "border-accent" : ""}`}
            onClick={() => {
              setSource(source === key ? null : key);
              setError(null);
            }}
          >
            {URL_SOURCES[key].button}
          </button>
        ))}
      </div>
      <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => { void chooseFile(e.target.files?.[0]); e.target.value = ""; }} />

      {source && (
        <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
          {URL_SOURCES[source].label}
          <input
            type="url"
            autoFocus
            placeholder="https://…"
            value={draft}
            aria-invalid={error !== null}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyUrl(source)}
            className="h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent"
          />
          <button type="button" className={button} onClick={() => applyUrl(source)}>Aplicar</button>
        </label>
      )}
      {error && <span role="alert" className="text-[11px] text-red-400">{error}</span>}
    </div>
  );
}
