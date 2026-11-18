import { CAPTURE_MESSAGE, CAPTURED_MESSAGE } from "../code/messages";

const TIMEOUT_MS = 10_000;

/** Convierte una imagen `data:` en un archivo que se puede subir. */
const toBlob = async (dataUrl: string): Promise<Blob> => (await fetch(dataUrl)).blob();

/** Le pide una foto a un iframe de bloque de código: lo saca él mismo, porque el editor no puede leer su documento. */
function captureFrame(frame: HTMLIFrameElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const finish = () => {
      clearTimeout(timer);
      removeEventListener("message", onMessage);
    };
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; id?: string; image?: string | null; error?: string } | null;
      if (event.source !== frame.contentWindow || data?.type !== CAPTURED_MESSAGE || data.id !== id) return;
      finish();
      if (data.image) toBlob(data.image).then(resolve, reject);
      else reject(new Error(data.error ?? "No se pudo sacar la captura."));
    };
    const timer = setTimeout(() => {
      finish();
      reject(new Error("La vista previa tardó demasiado en responder."));
    }, TIMEOUT_MS);

    addEventListener("message", onMessage);
    frame.contentWindow?.postMessage({ type: CAPTURE_MESSAGE, id }, "*");
  });
}

/** Saca una foto de la página de la vista previa (que se dibuja en el propio documento, sin iframe). */
async function capturePage(page: HTMLElement): Promise<Blob> {
  const { toBlob: elementToBlob } = await import("html-to-image");
  const blob = await elementToBlob(page, { pixelRatio: 1, skipFonts: true, backgroundColor: "#ffffff" });
  if (!blob) throw new Error("No se pudo sacar la captura.");
  return blob;
}

/** De dónde se saca la foto, en orden: la vista previa de un bloque (un iframe) o la de una página. */
const SOURCES: ReadonlyArray<{ find: () => HTMLElement | null; capture: (element: HTMLElement) => Promise<Blob> }> = [
  { find: () => document.querySelector<HTMLElement>('aside[aria-label="Vista previa"] iframe'), capture: (el) => captureFrame(el as HTMLIFrameElement) },
  { find: () => document.querySelector<HTMLElement>('aside[aria-label="Vista previa de la página"] [data-site-page]'), capture: capturePage },
];

/** La foto de la vista previa que se ve ahora en el editor de código. */
export async function capturePreview(): Promise<Blob> {
  const source = SOURCES.find(({ find }) => find());
  if (!source) throw new Error("No hay una vista previa abierta para capturar.");
  return source.capture(source.find()!);
}
