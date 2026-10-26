"use client";

import { useSiteDispatch } from "../site/site-context";
import type { BlockBox, BlockInstance } from "../site/types";
import { Collapsible } from "../ui/collapsible";
import { ColorInput } from "../ui/color-input";
import { MiniScreen, OptionCards, type CardOption } from "../ui/option-cards";
import { BackgroundForm } from "./background-form";
import type { BoxSpan } from "./types";

/** Cuánto ocupa la sección, con un dibujo de cada opción. */
const SPANS: CardOption<BoxSpan>[] = [
  { value: "content", label: "Su contenido", preview: <MiniScreen piece={{ left: "25%", top: "25%", width: "50%", height: "50%" }} /> },
  { value: "width", label: "Todo el ancho", preview: <MiniScreen piece={{ left: 0, top: "30%", width: "100%", height: "40%" }} /> },
  { value: "screen", label: "Pantalla completa", preview: <MiniScreen piece={{ left: 0, top: 0, width: "100%", height: "100%" }} /> },
];

interface SectionBackgroundProps {
  pageId: string;
  block: BlockInstance;
}

/** El fondo de una sección: color, degradado, imagen o video, con su velo, y si ocupa todo el ancho o la pantalla. */
export function SectionBackground({ pageId, block }: SectionBackgroundProps) {
  const dispatch = useSiteDispatch();
  const box = block.box;
  const set = (patch: BlockBox) => dispatch({ type: "block/box", pageId, blockId: block.id, patch });

  return (
    <Collapsible title="Fondo" defaultOpen={false} badge={box?.backdrop || box?.background ? <span className="text-[10px] text-accent">●</span> : null}>
      <p className="text-[11px] text-ink-dim">
        Para un banner: elige «Pantalla completa», una imagen o video y un velo; el título queda centrado encima.
      </p>

      <OptionCards label="Tamaño de la sección" value={box?.span ?? "content"} options={SPANS} onChange={(span) => set({ span: span === "content" ? undefined : span })} />

      <ColorInput label="Color o degradado de fondo" gradient value={box?.background ?? "transparent"} onChange={(background) => set({ background })} />
      {box?.background && (
        <button type="button" onClick={() => set({ background: undefined })} className="h-7 rounded-md border border-line text-[11px] hover:bg-hover">
          Quitar el color de fondo
        </button>
      )}

      <BackgroundForm value={box?.backdrop} onChange={(backdrop) => set({ backdrop })} />
    </Collapsible>
  );
}
