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

/** Puntos focales preestablecidos para el recorte estilo Canva (object-position). */
const FOCAL_POSITIONS = [
  { label: "Arriba Izquierda", value: "left top" },
  { label: "Arriba Centro", value: "center top" },
  { label: "Arriba Derecha", value: "right top" },
  { label: "Centro Izquierda", value: "left center" },
  { label: "Centro", value: "center center" },
  { label: "Centro Derecha", value: "right center" },
  { label: "Abajo Izquierda", value: "left bottom" },
  { label: "Abajo Centro", value: "center bottom" },
  { label: "Abajo Derecha", value: "right bottom" },
];

/** Ajuste al cuadro, recorte estilo Canva con punto focal y zoom, texto alternativo y opciones de video. */
export function MediaOptions({ element, kind, onChange }: { element: CanvasElement; kind: MediaKind; onChange: Change }) {
  const isFile = kind === "video" && !element.embed;
  const isImageOrFrame = kind === "image" || Boolean(element.src);
  const currentPos = element.objectPosition ?? "center center";
  const currentZoom = element.imageZoom ?? 1;

  return (
    <div className="flex flex-col gap-2.5">
      <Field label="Ajuste al marco">
        <select
          value={element.fit ?? "cover"}
          onChange={(e) => onChange({ fit: e.target.value as CanvasElement["fit"] })}
          className={inputClass}
        >
          <option value="cover">Cubrir (recorta y llena el marco)</option>
          <option value="contain">Contener (se ve entera sin recortar)</option>
        </select>
      </Field>

      {isImageOrFrame && (
        <div className="rounded-lg border border-line bg-canvas/30 p-2.5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-ink-bright">Recorte y enfoque estilo Canva</span>
            {(element.objectPosition || (element.imageZoom && element.imageZoom !== 1) || element.flipH || element.flipV) && (
              <button
                type="button"
                onClick={() => onChange({ objectPosition: "center center", imageZoom: 1, flipH: false, flipV: false })}
                className="text-[10px] text-accent hover:underline cursor-pointer"
              >
                Restablecer
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] text-ink-dim">
              <span>Zoom interior (recorte)</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onChange({ imageZoom: Math.max(0.25, parseFloat((currentZoom - 0.1).toFixed(2))) })}
                  title="Alejar imagen (zoom out)"
                  className="h-5 w-5 rounded border border-line bg-canvas flex items-center justify-center text-xs font-bold hover:bg-hover text-ink cursor-pointer"
                >
                  −
                </button>
                <span className="font-mono text-ink-bright min-w-[3rem] text-center">{Math.round(currentZoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => onChange({ imageZoom: Math.min(3, parseFloat((currentZoom + 0.1).toFixed(2))) })}
                  title="Acercar imagen (zoom in)"
                  className="h-5 w-5 rounded border border-line bg-canvas flex items-center justify-center text-xs font-bold hover:bg-hover text-ink cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="range"
              min={0.25}
              max={3}
              step={0.05}
              value={currentZoom}
              onChange={(e) => onChange({ imageZoom: parseFloat(e.target.value) })}
              className="w-full accent-accent cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-ink-dim">Punto focal de recorte</span>
            <div className="grid grid-cols-3 gap-1 w-24 mx-auto p-1 rounded border border-line bg-canvas">
              {FOCAL_POSITIONS.map((pos) => {
                const active = currentPos === pos.value;
                return (
                  <button
                    key={pos.value}
                    type="button"
                    title={pos.label}
                    onClick={() => onChange({ objectPosition: pos.value })}
                    className={`h-6 w-6 rounded text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center ${
                      active ? "bg-accent text-white" : "hover:bg-line/40 text-ink-dim"
                    }`}
                  >
                    +
                  </button>
                );
              })}
            </div>
            <select
              value={currentPos}
              onChange={(e) => onChange({ objectPosition: e.target.value })}
              className={`${inputClass} text-[11px] mt-1`}
            >
              {FOCAL_POSITIONS.map((pos) => (
                <option key={pos.value} value={pos.value}>
                  {pos.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-line/60">
            <span className="text-[11px] text-ink-dim">Volteo / Orientacion</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onChange({ flipH: !element.flipH })}
                className={`px-2 py-0.5 rounded text-[10px] font-medium border cursor-pointer ${
                  element.flipH ? "border-accent bg-accent/20 text-accent font-semibold" : "border-line text-ink-dim hover:bg-line/30"
                }`}
              >
                Horizontal
              </button>
              <button
                type="button"
                onClick={() => onChange({ flipV: !element.flipV })}
                className={`px-2 py-0.5 rounded text-[10px] font-medium border cursor-pointer ${
                  element.flipV ? "border-accent bg-accent/20 text-accent font-semibold" : "border-line text-ink-dim hover:bg-line/30"
                }`}
              >
                Vertical
              </button>
            </div>
          </div>
        </div>
      )}

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
