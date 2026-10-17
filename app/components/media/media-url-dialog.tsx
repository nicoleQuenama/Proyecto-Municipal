"use client";

import { useState, type FormEvent } from "react";
import { useCommands } from "../commands/commands-context";
import { Modal } from "../ui/modal";
import { useMedia } from "./media-context";
import { parseImageUrl, parseVideoUrl, type ParsedMedia, type ParseResult } from "./media-url";

type UrlDialog = "image-url" | "video-url";

const COPY: Record<
  UrlDialog,
  { title: string; placeholder: string; hint: string; parse: (input: string) => ParseResult<ParsedMedia> }
> = {
  "image-url": {
    title: "Insertar imagen desde URL",
    placeholder: "https://ejemplo.com/foto.jpg",
    hint: "Pega el enlace público de una imagen.",
    parse: parseImageUrl,
  },
  "video-url": {
    title: "Insertar video desde URL",
    placeholder: "https://www.youtube.com/watch?v=…",
    hint: "YouTube, Vimeo o un enlace directo a un archivo .mp4 / .webm.",
    parse: parseVideoUrl,
  },
};

export function MediaUrlDialog() {
  const { dialog, closeDialog } = useCommands();
  if (dialog !== "image-url" && dialog !== "video-url") return null;

  return (
    <Modal label={COPY[dialog].title} onClose={closeDialog}>
      <UrlForm kind={dialog} />
    </Modal>
  );
}

function UrlForm({ kind }: { kind: UrlDialog }) {
  const { closeDialog } = useCommands();
  const { addUrl } = useMedia();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[kind];

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = copy.parse(value);
    if (!result.ok) return setError(result.error);

    addUrl(result.value);
    closeDialog();
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold">{copy.title}</h2>

      <input
        autoFocus
        type="url"
        aria-label="URL"
        aria-invalid={error !== null}
        placeholder={copy.placeholder}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        className="h-9 rounded-md border border-line bg-canvas px-3 text-[13px] outline-none placeholder:text-ink-dim focus:border-accent"
      />

      {error ? (
        <p role="alert" className="text-xs text-red-400">{error}</p>
      ) : (
        <p className="text-xs text-ink-dim">{copy.hint}</p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={closeDialog}
          className="h-8 rounded-md px-3 text-xs text-ink-dim hover:bg-hover hover:text-ink"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!value.trim()}
          className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-white disabled:opacity-40"
        >
          Insertar
        </button>
      </div>
    </form>
  );
}
