"use client";

import { useState } from "react";
import type { Page } from "../site/types";
import { useNavigation } from "../navigation/navigation-context";
import { useStyles } from "../styles/use-styles";
import { useMedia } from "./media-context";
import type { MediaItem } from "./types";

function MediaPreview({ item, onError }: { item: MediaItem; onError: () => void }) {
  if (item.kind === "image") {
    // <img> en lugar de next/image: las fuentes son object URLs o dominios arbitrarios.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.src} alt={item.name} draggable={false} onError={onError} className="w-full" />;
  }

  if (item.embed) {
    return (
      <iframe
        src={item.src}
        title={item.name}
        allow="fullscreen; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="aspect-video w-full"
      />
    );
  }

  return <video src={item.src} controls onError={onError} className="w-full" />;
}

function MediaCard({
  item,
  radius,
  removable,
}: {
  item: MediaItem;
  radius: string | undefined;
  removable: boolean;
}) {
  const { remove } = useMedia();
  const [failed, setFailed] = useState(false);

  return (
    <figure
      className="group relative overflow-hidden rounded-md bg-neutral-100"
      style={{ borderRadius: radius }}
    >
      {failed ? (
        <p role="alert" className="p-6 text-center text-sm text-neutral-500">
          No se pudo cargar «{item.name}». Revisa que el enlace sea público y directo.
        </p>
      ) : (
        <MediaPreview item={item} onError={() => setFailed(true)} />
      )}

      {removable && (
        <button
          type="button"
          aria-label={`Quitar ${item.name}`}
          onClick={() => remove(item.id)}
          className="absolute top-2 right-2 hidden h-7 w-7 items-center justify-center rounded-md bg-black/70 text-white group-hover:flex focus:flex"
        >
          ×
        </button>
      )}
    </figure>
  );
}

export function MediaList({ page, interactive }: { page: Page; interactive: boolean }) {
  const items = page.media;
  const styles = useStyles(page.id);
  const { mode } = useNavigation();
  if (items.length === 0) return null;

  return (
    <div className="mt-8 flex flex-col gap-6" style={{ gap: styles.page.gap }}>
      {items.map((item) => (
        <MediaCard
          key={item.id}
          item={item}
          radius={styles.role("image").radius}
          removable={interactive && mode === "edit"}
        />
      ))}
    </div>
  );
}
