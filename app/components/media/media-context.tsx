"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useCurrentPage, useSiteDispatch } from "../site/site-context";
import { parseMediaUrl, type ParsedMedia } from "./media-url";
import type { MediaItem } from "./types";

interface MediaContextValue {
  /** Imágenes y videos de la página actual. */
  items: MediaItem[];
  notice: string | null;
  addUrl: (media: ParsedMedia) => void;
  addFiles: (files: Iterable<File>) => void;
  /** Procesa lo que se suelta en el lienzo: archivos o un enlace arrastrado desde otra web. */
  addFromDrop: (data: DataTransfer) => void;
  pickImages: () => void;
  remove: (id: string) => void;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const NOTICE_MS = 4000;
const VIDEO_FILES_MESSAGE = "Los videos solo se pueden agregar con un enlace (URL).";

const MediaContext = createContext<MediaContextValue | null>(null);

export function useMedia() {
  const ctx = useContext(MediaContext);
  if (!ctx) throw new Error("Debe usarse dentro de <MediaProvider>");
  return ctx;
}

/** Devuelve el motivo del rechazo, o null si el archivo es una imagen válida. */
function rejectionOf(file: File): string | null {
  if (file.type.startsWith("video/")) return VIDEO_FILES_MESSAGE;
  if (!file.type.startsWith("image/")) return `«${file.name}» no es una imagen.`;
  if (file.size > MAX_IMAGE_BYTES) return `«${file.name}» pesa más de 10 MB.`;
  return null;
}

function firstUrlIn(data: DataTransfer): string | undefined {
  return (data.getData("text/uri-list") || data.getData("text/plain"))
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#"));
}

/** Los medios viven en cada página; este contexto aporta las operaciones sobre la página actual. */
export function MediaProvider({ children }: { children: ReactNode }) {
  const { media: items } = useCurrentPage();
  const dispatch = useSiteDispatch();
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | undefined>(undefined);

  const notify = useCallback((message: string) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), NOTICE_MS);
  }, []);

  const addItem = useCallback(
    (media: ParsedMedia, local: boolean) => {
      dispatch({ type: "media/add", item: { ...media, id: crypto.randomUUID(), local } });
    },
    [dispatch],
  );

  const addUrl = useCallback((media: ParsedMedia) => addItem(media, false), [addItem]);

  const addFiles = useCallback(
    (files: Iterable<File>) => {
      const problems: string[] = [];

      for (const file of files) {
        const problem = rejectionOf(file);
        if (problem) {
          problems.push(problem);
          continue;
        }
        addItem(
          { kind: "image", src: URL.createObjectURL(file), name: file.name, embed: false },
          true,
        );
      }

      if (problems.length) notify([...new Set(problems)].join(" "));
    },
    [addItem, notify],
  );

  const addFromDrop = useCallback(
    (data: DataTransfer) => {
      if (data.files.length) return addFiles(Array.from(data.files));

      const link = firstUrlIn(data);
      if (!link) return;

      const parsed = parseMediaUrl(link);
      if (parsed.ok) addUrl(parsed.value);
      else notify(parsed.error);
    },
    [addFiles, addUrl, notify],
  );

  const pickImages = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = () => addFiles(Array.from(input.files ?? []));
    input.click();
  }, [addFiles]);

  const remove = useCallback(
    (id: string) => {
      const target = items.find((item) => item.id === id);
      if (target?.local) URL.revokeObjectURL(target.src);
      dispatch({ type: "media/remove", id });
    },
    [items, dispatch],
  );

  const value = useMemo(
    () => ({ items, notice, addUrl, addFiles, addFromDrop, pickImages, remove }),
    [items, notice, addUrl, addFiles, addFromDrop, pickImages, remove],
  );

  return <MediaContext value={value}>{children}</MediaContext>;
}
