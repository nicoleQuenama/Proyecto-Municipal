"use client";

import { useRef, useState } from "react";
import { uploadMedia } from "../media/upload-media";
import { capturePreview } from "./capture-preview";

interface ThumbnailPickerProps {
  /** La dirección de la imagen ya subida, o `null` si todavía no hay. */
  value: string | null;
  onChange: (url: string | null) => void;
}

/** La imagen obligatoria de una plantilla: se saca de la vista previa o se sube desde el equipo, y va a ImageKit. */
export function ThumbnailPicker({ value, onChange }: ThumbnailPickerProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const run = async (getFile: () => Promise<File>) => {
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadMedia(await getFile()));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudo obtener la imagen.");
    } finally {
      setBusy(false);
    }
  };

  const capture = () =>
    run(async () => new File([await capturePreview()], `plantilla-${Date.now()}.png`, { type: "image/png" }));

  const button = "h-7 flex-1 rounded-md bg-hover px-2 text-[11px] text-ink hover:bg-accent hover:text-white disabled:opacity-50 cursor-pointer";

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] text-ink-dim">Imagen de la plantilla (obligatoria)</p>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="Imagen de la plantilla" className="max-h-28 w-full rounded-md border border-line object-contain bg-white" />
      ) : (
        <div className="flex h-16 items-center justify-center rounded-md border border-dashed border-line text-[11px] text-ink-dim">Sin imagen</div>
      )}
      <div className="flex gap-1.5">
        <button type="button" disabled={busy} onClick={capture} className={button}>
          {busy ? "Procesando…" : "Capturar vista previa"}
        </button>
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className={button}>
          Subir imagen
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          aria-label="Subir imagen de la plantilla"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void run(async () => file);
          }}
        />
      </div>
      {error && <p role="alert" className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
