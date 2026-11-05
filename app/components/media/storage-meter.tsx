"use client";

import { useCallback, useEffect, useState } from "react";
import type { StorageUsage } from "../../server/media/usage";
import { REQUEST_HEADER } from "../../server/request-header";
import { MEDIA_UPLOADED_EVENT } from "./upload-media";

const MB = 1024 * 1024;

/** «12,4 MB», «3,2 GB»: lo que se entiende de un vistazo. */
export function formatBytes(bytes: number): string {
  if (bytes < MB) return `${Math.max(0, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * MB) return `${(bytes / MB).toFixed(1).replace(".", ",")} MB`;
  return `${(bytes / 1024 / MB).toFixed(1).replace(".", ",")} GB`;
}

/** Cómo se pinta la barra según lo lleno que esté: de verde a rojo, para avisar antes de que subir deje de funcionar. */
export function toneOf(fraction: number): { bar: string; text: string } {
  if (fraction >= 0.95) return { bar: "bg-red-500", text: "text-red-400" };
  if (fraction >= 0.8) return { bar: "bg-amber-400", text: "text-amber-300" };
  return { bar: "bg-accent", text: "text-ink-dim" };
}

/** Cuánto almacenamiento de imágenes y videos usa la organización frente a su plan; se actualiza solo al subir un archivo. */
export function StorageMeter() {
  const [usage, setUsage] = useState<StorageUsage | null>(null);

  const read = useCallback(async () => {
    const response = await fetch("/api/cms/assets", { headers: { [REQUEST_HEADER]: "1" } }).catch(() => null);
    if (response?.ok) setUsage(((await response.json()) as { usage: StorageUsage }).usage);
  }, []);

  useEffect(() => {
    const first = setTimeout(() => void read(), 0);
    window.addEventListener(MEDIA_UPLOADED_EVENT, read);
    return () => {
      clearTimeout(first);
      window.removeEventListener(MEDIA_UPLOADED_EVENT, read);
    };
  }, [read]);

  if (!usage) return null;
  const fraction = Math.min(1, usage.usedBytes / usage.maxBytes);
  const tone = toneOf(fraction);

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-line px-3 py-2 text-[11px]" role="group" aria-label="Almacenamiento de imágenes y videos">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-ink">Almacenamiento</span>
        <span className={tone.text}>
          {formatBytes(usage.usedBytes)} de {formatBytes(usage.maxBytes)} · {usage.files} {usage.files === 1 ? "archivo" : "archivos"}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-hover" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fraction * 100)}>
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.max(fraction * 100, usage.usedBytes > 0 ? 2 : 0)}%` }} />
      </div>
      {fraction >= 0.95 && <p className="text-red-400">Casi no queda espacio: pronto no podrás subir más archivos. Borra los que ya no uses o pide ampliar el plan.</p>}
      {!usage.configured && <p className="text-amber-300">ImageKit no está configurado en este servidor: todavía no se pueden subir archivos.</p>}
    </div>
  );
}
