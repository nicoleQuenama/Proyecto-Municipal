import type { CanvasElement } from "./types";

interface VideoContentProps {
  element: CanvasElement;
  /** Las esquinas: las del elemento, o `inherit` si las pone el contenedor. */
  radius: number | string;
}

/** Un video que llena el cuadro de su elemento: un reproductor incrustado (YouTube, Vimeo) o un archivo. */
export function VideoContent({ element, radius }: VideoContentProps) {
  const frame = "h-full w-full overflow-hidden bg-neutral-800";

  if (!element.src) {
    return (
      <div className={`${frame} flex items-center justify-center text-xs text-neutral-400`} style={{ borderRadius: radius }}>
        Video
      </div>
    );
  }

  return (
    <div className={frame} style={{ borderRadius: radius }}>
      {element.embed ? (
        <iframe
          src={element.src}
          title="Video"
          allow="autoplay; fullscreen; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="h-full w-full border-0"
        />
      ) : (
        <video src={element.src} controls className="h-full w-full object-cover" />
      )}
    </div>
  );
}
