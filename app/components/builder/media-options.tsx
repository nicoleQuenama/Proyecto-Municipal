import type { CanvasElement } from "../site/types";
import type { MediaKind } from "./media-patch";
import { Field, inputClass } from "./panel-fields";

type Change = (patch: Partial<CanvasElement>) => void;

/** Las casillas de reproducción de un video: qué clave del elemento cambia cada una. */
const VIDEO_FLAGS = [
  { key: "autoplay", label: "Reproducir solo" },
  { key: "muted", label: "Silenciado" },
  { key: "loop", label: "En bucle" },
] as const;

/** Ajuste al cuadro, texto alternativo y, en un video de archivo, portada y reproducción. */
export function MediaOptions({ element, kind, onChange }: { element: CanvasElement; kind: MediaKind; onChange: Change }) {
  const isFile = kind === "video" && !element.embed;

  return (
    <div className="flex flex-col gap-2">
      <Field label="Ajuste">
        <select
          value={element.fit ?? "cover"}
          onChange={(e) => onChange({ fit: e.target.value as CanvasElement["fit"] })}
          className={inputClass}
        >
          <option value="cover">Cubrir (recorta lo que sobra)</option>
          <option value="contain">Contener (se ve entera)</option>
        </select>
      </Field>

      <Field label="Texto alternativo (alt)">
        <input
          value={element.alt ?? ""}
          placeholder={kind === "image" ? "Describe la imagen" : "Describe el video"}
          onChange={(e) => onChange({ alt: e.target.value })}
          className={inputClass}
        />
      </Field>

      {isFile && (
        <>
          <Field label="Portada (URL de imagen)">
            <input
              value={element.poster?.startsWith("data:") ? "(imagen subida)" : (element.poster ?? "")}
              placeholder="https://…"
              onChange={(e) => onChange({ poster: e.target.value || undefined })}
              className={inputClass}
            />
          </Field>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {VIDEO_FLAGS.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-1 text-[11px] text-ink-dim">
                <input type="checkbox" checked={element[key] === true} onChange={(e) => onChange({ [key]: e.target.checked })} />
                {label}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
