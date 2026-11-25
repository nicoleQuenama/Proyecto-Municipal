"use client";

import { useState, type DragEvent } from "react";
import { useSiteDispatch } from "../site/site-context";
import type { CanvasElement } from "../site/types";
import { MediaPickerModal } from "../media/media-picker-modal";
import { MediaOptions } from "../builder/media-options";
import { optimizedSrc } from "../media/optimize-src";
import { Collapsible } from "../ui/collapsible";

interface InspectorMediaControlsProps {
  element: CanvasElement;
  componentId: string;
  pageId: string;
  blockId: string;
  level?: "block" | "component";
}

export function InspectorMediaControls({
  element,
  componentId,
  pageId,
  blockId,
  level = "block",
}: InspectorMediaControlsProps) {
  const dispatch = useSiteDispatch();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const patchElement = (patch: Partial<CanvasElement>) => {
    if (level === "component") {
      dispatch({
        type: "component/element",
        componentId,
        pageId,
        blockId,
        elementId: element.id,
        patch,
      });
    } else {
      dispatch({
        type: "block/style",
        pageId,
        blockId,
        elementIds: [element.id],
        patch,
      });
    }
  };

  const isShape = element.kind === "rect" || element.kind === "ellipse";
  const title = isShape ? "Foto / Fondo del recuadro" : "Imagen / Fotografía";

  const handleDragOver = (e: DragEvent) => {
    const types = Array.from(e.dataTransfer.types);
    if (
      types.includes("application/x-cms-media") ||
      types.includes("text/uri-list") ||
      types.includes("Files")
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
      setDragOver(true);
    }
  };

  const handleDrop = async (e: DragEvent) => {
    setDragOver(false);
    e.preventDefault();
    e.stopPropagation();

    const mediaUri =
      e.dataTransfer.getData("application/x-cms-media") ||
      e.dataTransfer.getData("text/uri-list") ||
      e.dataTransfer.getData("text/plain");

    if (
      mediaUri &&
      (mediaUri.startsWith("http://") ||
        mediaUri.startsWith("https://") ||
        mediaUri.startsWith("/") ||
        mediaUri.startsWith("data:"))
    ) {
      patchElement({
        src: mediaUri.trim(),
        ...(isShape ? { role: "image" } : {}),
      });
      return;
    }

    const file = e.dataTransfer.files?.[0];
    if (file) {
      try {
        const { uploadMedia } = await import("../media/upload-media");
        const uploadedUrl = await uploadMedia(file);
        patchElement({
          src: uploadedUrl,
          ...(isShape ? { role: "image" } : {}),
        });
      } catch {
        const reader = new FileReader();
        reader.onload = () => {
          patchElement({
            src: String(reader.result),
            ...(isShape ? { role: "image" } : {}),
          });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleApplyManual = () => {
    if (!manualUrl.trim()) return;
    patchElement({
      src: manualUrl.trim(),
      ...(isShape ? { role: "image" } : {}),
    });
    setManualUrl("");
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-accent/40 bg-accent/5 p-3 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink">{title}</span>
        {element.src && (
          <button
            type="button"
            onClick={() => patchElement({ src: "" })}
            className="text-[10px] text-red-500 hover:text-red-400 hover:underline cursor-pointer font-medium"
          >
            Quitar foto
          </button>
        )}
      </div>

      {element.src ? (
        <div className="flex flex-col gap-2">
          {/* Vista previa con estilo de recorte aplicado */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative flex h-28 w-full items-center justify-center overflow-hidden rounded-md border bg-slate-900 transition-all ${
              dragOver ? "border-accent ring-2 ring-accent" : "border-line"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={optimizedSrc(element.src)}
              alt={element.alt ?? "Foto asignada"}
              className="h-full w-full object-cover"
              style={{
                objectFit: element.fit ?? "cover",
                objectPosition: element.objectPosition ?? "center center",
                transform: `${element.flipH ? "scaleX(-1)" : ""} ${element.flipV ? "scaleY(-1)" : ""}`.trim() || undefined,
              }}
            />
            {dragOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-accent/30 text-xs font-bold text-white backdrop-blur-xs">
                Soltar para reemplazar foto
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex-1 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-accent/90 active:scale-95 transition-all cursor-pointer text-center"
            >
              Cambiar foto desde galería
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-3 text-center transition-all ${
            dragOver ? "border-accent bg-accent/20" : "border-line bg-canvas/60"
          }`}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-medium text-ink">
              {dragOver ? "Suelta la foto aquí" : "Sin foto asignada a este recuadro"}
            </span>
            <span className="text-[10px] text-ink-dim max-w-[200px]">
              Arrastra una foto sobre este recuadro o selecciónala de la galería municipal
            </span>
          </div>

          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="rounded-md bg-accent px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-accent/90 active:scale-95 transition-all cursor-pointer"
          >
            Elegir de la biblioteca municipal
          </button>
        </div>
      )}

      {/* Controles estilo Canva de orientación, zoom y punto focal */}
      {element.src && (
        <Collapsible title="Ajuste y recorte estilo Canva" defaultOpen>
          <MediaOptions
            element={element}
            kind={element.kind === "video" ? "video" : "image"}
            onChange={patchElement}
          />
        </Collapsible>
      )}

      {/* Opción secundaria para URLs externas (discreta) */}
      <div className="border-t border-line/60 pt-2 text-[11px]">
        {!showManualUrl ? (
          <button
            type="button"
            onClick={() => setShowManualUrl(true)}
            className="text-ink-dim hover:text-accent underline cursor-pointer"
          >
            Ingresar enlace URL externo (avanzado)
          </button>
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-ink-dim">
              <span>URL directa externa</span>
              <button
                type="button"
                onClick={() => setShowManualUrl(false)}
                className="hover:text-ink cursor-pointer"
              >
                Ocultar
              </button>
            </div>
            <div className="flex gap-1.5">
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://servidor.com/foto.jpg"
                className="flex-1 rounded-md border border-line bg-canvas px-2.5 py-1 text-xs text-ink focus:border-accent focus:outline-hidden font-mono"
              />
              <button
                type="button"
                onClick={handleApplyManual}
                disabled={!manualUrl.trim()}
                className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-white hover:bg-accent/90 disabled:opacity-40 cursor-pointer"
              >
                Usar
              </button>
            </div>
          </div>
        )}
      </div>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(asset) => {
          patchElement({
            src: asset.src,
            alt: asset.name,
            ...(isShape ? { role: "image" } : {}),
          });
        }}
        currentSrc={element.src}
        title="Elegir foto para el recuadro"
      />
    </div>
  );
}
