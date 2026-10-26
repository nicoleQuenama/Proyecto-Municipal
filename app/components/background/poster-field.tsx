"use client";

import { useRef, useState } from "react";
import { imageFileProblem, readAsDataUrl } from "../media/image-file";

const button = "h-8 rounded-md border border-line px-2 text-xs hover:bg-hover";

interface PosterFieldProps {
  poster: string | undefined;
  onChange: (poster: string | undefined) => void;
}

/** La imagen de portada de un video de fondo: se ve mientras carga o si la persona pidió menos movimiento. */
export function PosterField({ poster, onChange }: PosterFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = async (file: File | undefined) => {
    if (!file) return;
    const problem = imageFileProblem(file);
    if (problem) return setError(problem);
    setError(null);
    onChange(await readAsDataUrl(file));
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-ink-dim">Imagen de portada del video</span>
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {poster && <img src={poster} alt="Portada" className="h-8 w-12 rounded object-cover" />}
        <button type="button" className={button} onClick={() => input.current?.click()}>
          {poster ? "Cambiar" : "Subir portada"}
        </button>
        {poster && <button type="button" className={button} onClick={() => onChange(undefined)}>Quitar</button>}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { void choose(e.target.files?.[0]); e.target.value = ""; }} />
      {error && <span role="alert" className="text-[11px] text-red-400">{error}</span>}
    </div>
  );
}
