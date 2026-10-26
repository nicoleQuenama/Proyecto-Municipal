"use client";

import { BackgroundSource } from "./background-source";
import { BackgroundAdjust } from "./background-adjust";
import { DEFAULT_BACKGROUND, hasBackground } from "./background-css";
import { PosterField } from "./poster-field";
import type { BlockBackground } from "./types";

interface BackgroundFormProps {
  value: BlockBackground | undefined;
  onChange: (value: BlockBackground | undefined) => void;
}

/** Elegir una imagen o un video de fondo (subida o URL) y ajustar cómo se ve. */
export function BackgroundForm({ value, onChange }: BackgroundFormProps) {
  const bg = hasBackground(value) ? value : undefined;
  const patch = (change: Partial<BlockBackground>) => bg && onChange({ ...bg, ...change });

  return (
    <div className="flex flex-col gap-3">
      <BackgroundSource onPick={({ kind, src, embed }) => onChange({ ...DEFAULT_BACKGROUND, ...bg, kind, src, embed })} />

      {bg && (
        <>
          <p className="truncate rounded-md bg-canvas px-2 py-1.5 text-[11px] text-ink-dim" title={bg.src.startsWith("data:") ? "Imagen subida" : bg.src}>
            {bg.kind === "video" ? "Video" : "Imagen"}: {bg.src.startsWith("data:") ? "subida desde tu equipo" : bg.src}
          </p>
          {bg.kind === "video" && (
            <>
              <p className="text-[11px] text-ink-dim">Se reproduce sin sonido y en bucle. Con «menos movimiento» activado en el equipo, solo se ve la portada.</p>
              <PosterField poster={bg.poster} onChange={(poster) => patch({ poster })} />
            </>
          )}
          <BackgroundAdjust value={bg} onChange={patch} />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="h-8 rounded-md border border-line text-xs text-red-400 hover:bg-red-500/15"
          >
            Quitar el fondo de imagen o video
          </button>
        </>
      )}
    </div>
  );
}
