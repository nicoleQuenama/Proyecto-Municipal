"use client";

import { useState } from "react";
import type { Placement } from "../placement/types";
import type { Page } from "../site/types";
import { useNavigation } from "../navigation/navigation-context";
import { PlacementGrip } from "../placement/placement-grip";
import { placementAttributes, placementStyle } from "../placement/placement-style";
import { usePlacementDrag } from "../placement/use-placement-drag";
import { useWidthResize } from "../placement/use-width-resize";
import { WidthHandles } from "../placement/width-handles";
import { HiddenPlaceholder } from "../site/hidden-placeholder";
import { useSiteDispatch } from "../site/site-context";
import { VisibilityEye } from "../site/visibility-eye";
import { useStyles } from "../styles/use-styles";
import { useMedia } from "./media-context";
import { autoplayUrl, providerThumbnail } from "./poster";
import { PosterMenu } from "./poster-menu";
import type { MediaItem } from "./types";

interface CoverProps {
  item: MediaItem;
  /** La imagen de portada, si hay una. */
  image: string | null;
  /** Al pulsarla empieza el video; sin esto la portada solo se ve (al editar). */
  onPlay?: () => void;
}

/** La portada de un video incrustado: una imagen con el botón de reproducir. */
function VideoCover({ item, image, onPlay }: CoverProps) {
  const play = (
    <span aria-hidden className="flex h-14 w-14 items-center justify-center rounded-full bg-black/70 text-2xl text-white">
      ▶
    </span>
  );
  const frame = "relative flex aspect-video w-full items-center justify-center bg-neutral-800";
  const picture = image && (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
  );

  if (!onPlay) {
    return (
      <div className={frame}>
        {picture}
        <span className="relative">{play}</span>
        {!image && <span className="absolute bottom-2 left-3 text-xs text-neutral-400">Video · {item.name}</span>}
      </div>
    );
  }

  return (
    <button type="button" aria-label={`Reproducir ${item.name}`} onClick={onPlay} className={`${frame} cursor-pointer`}>
      {picture}
      <span className="relative">{play}</span>
    </button>
  );
}

function MediaPreview({ item, editing, onError }: { item: MediaItem; editing: boolean; onError: () => void }) {
  const [playing, setPlaying] = useState(false);

  if (item.kind === "image") {
    // <img> en lugar de next/image: las fuentes son object URLs o dominios arbitrarios.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.src} alt={item.name} draggable={false} onError={onError} className="w-full" />;
  }

  if (item.embed) {
    // Al editar se ve una imagen fija (la portada, o la miniatura del proveedor): así se puede pulsar con el botón
    // derecho y no se carga un reproductor. Al probar, con portada, el reproductor aparece al pulsarla.
    if (editing) return <VideoCover item={item} image={item.poster ?? providerThumbnail(item)} />;
    if (item.poster && !playing) return <VideoCover item={item} image={item.poster} onPlay={() => setPlaying(true)} />;

    return (
      <iframe
        src={playing ? autoplayUrl(item.src) : item.src}
        title={item.name}
        allow="autoplay; fullscreen; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="aspect-video w-full"
      />
    );
  }

  return <video src={item.src} poster={item.poster} controls onError={onError} className="w-full" />;
}

function MediaCard({
  item,
  pageId,
  radius,
  editing,
  removable,
}: {
  item: MediaItem;
  pageId: string;
  radius: string | undefined;
  /** Se puede ocultar o mostrar con el ojo, y poner portada a un video. */
  editing: boolean;
  removable: boolean;
}) {
  const { remove } = useMedia();
  const dispatch = useSiteDispatch();
  const [failed, setFailed] = useState(false);
  const [posterMenu, setPosterMenu] = useState<{ x: number; y: number } | null>(null);
  const setHidden = (hidden: boolean) =>
    dispatch({ type: "hidden/set", target: { kind: "media", pageId, mediaId: item.id }, hidden });
  const place = (placement: Placement) => dispatch({ type: "media/place", pageId, mediaId: item.id, placement });
  const resize = useWidthResize({ enabled: removable, onPlace: place });
  const move = usePlacementDrag({
    enabled: removable,
    onPlace: place,
    onTransfer: (toPageId, placement) =>
      dispatch({ type: "media/transfer", fromPageId: pageId, toPageId, mediaId: item.id, placement }),
  });

  // Oculto: no se ve. Al editar queda un ojo en su lugar para volver a mostrarlo.
  if (item.hidden) return <HiddenPlaceholder label={`Oculto · ${item.name}`} onShow={() => setHidden(false)} />;

  const canSetPoster = editing && item.kind === "video";

  return (
    <figure
      {...placementAttributes(item.placement)}
      className={`group ${item.placement ? "absolute" : "relative"} ${move.dragging ? "z-50" : ""} overflow-hidden rounded-md bg-neutral-100`}
      style={{ borderRadius: radius, ...placementStyle(item.placement, true) }}
      onContextMenu={
        canSetPoster
          ? (e) => {
              e.preventDefault();
              setPosterMenu({ x: e.clientX, y: e.clientY });
            }
          : undefined
      }
    >
      {failed ? (
        <p role="alert" className="p-6 text-center text-sm text-neutral-500">
          No se pudo cargar «{item.name}». Revisa que el enlace sea público y directo.
        </p>
      ) : (
        <MediaPreview item={item} editing={editing} onError={() => setFailed(true)} />
      )}

      {removable && <WidthHandles onStart={resize.startResize} />}
      {removable && (
        <PlacementGrip
          label={item.name}
          onStart={move.startDrag}
          className="absolute top-2 left-1/2 hidden -translate-x-1/2 group-hover:flex focus:flex"
        />
      )}
      {editing && (
        <VisibilityEye
          hidden={false}
          label={item.name}
          onToggle={() => setHidden(true)}
          className="absolute top-2 left-2 hidden group-hover:flex focus:flex"
        />
      )}
      {canSetPoster && (
        <button
          type="button"
          onClick={(e) => {
            const box = e.currentTarget.getBoundingClientRect();
            setPosterMenu({ x: box.left, y: box.bottom + 6 });
          }}
          className="absolute top-2 left-10 hidden h-5 items-center rounded-full bg-black/70 px-2 text-[11px] text-white hover:bg-accent group-hover:flex focus:flex"
        >
          {item.poster ? "Cambiar portada" : "Poner portada"}
        </button>
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

      {posterMenu && <PosterMenu item={item} pageId={pageId} point={posterMenu} onClose={() => setPosterMenu(null)} />}
    </figure>
  );
}

export function MediaList({ page, interactive }: { page: Page; interactive: boolean }) {
  const items = page.media;
  const styles = useStyles(page.id);
  const { mode } = useNavigation();
  const shown = mode === "preview" ? items.filter((item) => !item.hidden) : items;
  if (shown.length === 0) return null;

  const card = (item: MediaItem) => (
    <MediaCard
      key={item.id}
      item={item}
      pageId={page.id}
      radius={styles.role("image").radius}
      editing={mode === "edit"}
      removable={interactive && mode === "edit"}
    />
  );
  const isPlaced = (item: MediaItem) => item.placement !== undefined && !item.hidden;
  const inFlow = shown.filter((item) => !isPlaced(item));

  return (
    <>
      {inFlow.length > 0 && (
        <div className="mt-8 flex flex-col gap-6" style={{ gap: styles.page.gap }}>
          {inFlow.map(card)}
        </div>
      )}
      {shown.filter(isPlaced).map(card)}
    </>
  );
}
