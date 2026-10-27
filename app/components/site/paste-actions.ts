import { writeClip } from "./clipboard";
import { copyBlocks, type Clip, type PasteAction } from "./paste-rules";
import type { SiteState } from "./types";

/** La acción de pegar esas copias en una página, con ids nuevos para cada sección y su componente. */
export const pasteAction = (pageId: string, clips: Clip[]): PasteAction => ({
  type: "block/paste",
  pageId,
  clips,
  blockIds: clips.map(() => crypto.randomUUID()),
  componentIds: clips.map(() => crypto.randomUUID()),
});

/** Copia las secciones al portapapeles del lienzo y devuelve lo copiado (vacío si no había nada que copiar). */
export function copySelection(state: SiteState, pageId: string, blockIds: string[]): Clip[] {
  const clips = copyBlocks(state, pageId, blockIds);
  if (clips.length > 0) writeClip(clips);
  return clips;
}
