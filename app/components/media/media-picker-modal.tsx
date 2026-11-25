"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { useSite, useSiteDispatch } from "../site/site-context";
import type { ProjectMediaAsset } from "../site/types";
import { matchMediaAsset } from "./media-usage";
import { uploadMedia } from "./upload-media";
import { imageFileProblem } from "./image-file";

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: { src: string; name: string }) => void;
  currentSrc?: string;
  title?: string;
}

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  currentSrc,
  title = "Biblioteca de Medios Municipales",
}: MediaPickerModalProps) {
  const site = useSite();
  const dispatch = useSiteDispatch();
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [filterKind, setFilterKind] = useState<"all" | "image" | "video">("image");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allAssets = useMemo(() => site.projectMedia ?? [], [site.projectMedia]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    for (const item of allAssets) {
      if (item.tag?.trim()) set.add(item.tag.trim());
      if (item.tags) {
        for (const t of item.tags) {
          if (t?.trim()) set.add(t.trim());
        }
      }
    }
    return Array.from(set);
  }, [allAssets]);

  const filtered = useMemo(() => {
    return allAssets.filter((item) => {
      if (filterKind === "image" && item.kind !== "image") return false;
      if (filterKind === "video" && item.kind !== "video") return false;

      if (selectedTag) {
        const matchesMainTag = item.tag?.toLowerCase() === selectedTag.toLowerCase();
        const matchesExtraTags = item.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
        if (!matchesMainTag && !matchesExtraTags) return false;
      }

      if (query.trim() && !matchMediaAsset(query, item)) {
        return false;
      }

      return true;
    });
  }, [allAssets, filterKind, selectedTag, query]);

  if (!open) return null;

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const problem = imageFileProblem(file);
    if (problem) {
      setUploadError(problem);
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      let finalSrc = "";
      try {
        finalSrc = await uploadMedia(file, site.activeUnitId ?? null);
      } catch {
        finalSrc = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.readAsDataURL(file);
        });
      }

      const newAsset: ProjectMediaAsset = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^/.]+$/, ""),
        src: finalSrc,
        kind: "image",
        size: file.size,
        createdAt: Date.now(),
        unitId: site.activeUnitId ?? null,
        tag: "General",
      };

      dispatch({ type: "project-media/add", asset: newAsset });
      onSelect({ src: finalSrc, name: newAsset.name });
      onClose();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error al procesar la imagen");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleApplyManualUrl = () => {
    if (!manualUrl.trim()) return;
    onSelect({ src: manualUrl.trim(), name: "Imagen externa" });
    setManualUrl("");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-line bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 bg-canvas/40">
          <div>
            <h3 className="text-sm font-bold text-ink">{title}</h3>
            <p className="text-[11px] text-ink-dim">
              Selecciona una imagen registrada en el sistema municipal o sube una nueva
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-dim hover:bg-hover hover:text-ink cursor-pointer"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Barra de búsqueda, filtros y botón de subida */}
        <div className="flex flex-col gap-2.5 border-b border-line px-5 py-3 bg-panel">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre o etiqueta municipal..."
                autoFocus
                className="w-full rounded-md border border-line bg-canvas px-3 py-1.5 text-xs text-ink placeholder:text-ink-dim/60 focus:border-accent focus:outline-hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-dim hover:text-ink cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex rounded-md border border-line p-0.5 bg-canvas/50">
              <button
                type="button"
                onClick={() => setFilterKind("image")}
                className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  filterKind === "image" ? "bg-accent text-white" : "text-ink-dim hover:text-ink"
                }`}
              >
                Fotos
              </button>
              <button
                type="button"
                onClick={() => setFilterKind("video")}
                className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  filterKind === "video" ? "bg-accent text-white" : "text-ink-dim hover:text-ink"
                }`}
              >
                Videos
              </button>
              <button
                type="button"
                onClick={() => setFilterKind("all")}
                className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  filterKind === "all" ? "bg-accent text-white" : "text-ink-dim hover:text-ink"
                }`}
              >
                Todos
              </button>
            </div>

            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-accent/90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>+</span>
              <span>{uploading ? "Subiendo..." : "Subir nueva"}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileUpload}
            />
          </div>

          {/* Chips de etiquetas disponibles */}
          {availableTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <span className="text-ink-dim shrink-0">Etiquetas:</span>
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className={`rounded-full px-2 py-0.5 font-medium transition-colors cursor-pointer shrink-0 ${
                  selectedTag === null
                    ? "bg-accent/20 text-accent font-semibold"
                    : "bg-canvas text-ink-dim hover:text-ink border border-line"
                }`}
              >
                Todas
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`rounded-full px-2 py-0.5 font-medium transition-colors cursor-pointer shrink-0 ${
                    selectedTag === tag
                      ? "bg-accent/20 text-accent font-semibold"
                      : "bg-canvas text-ink-dim hover:text-ink border border-line"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {uploadError && (
            <p role="alert" className="text-xs text-red-500 font-medium">
              {uploadError}
            </p>
          )}
        </div>

        {/* Cuadrícula de fotos registradas */}
        <div className="flex-1 overflow-y-auto p-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-2 h-10 w-10 rounded-full border border-line bg-canvas flex items-center justify-center text-ink-dim">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-ink">No hay archivos que coincidan</p>
              <p className="mt-1 text-[11px] text-ink-dim max-w-sm">
                No encontramos fotos con esos criterios. Puedes subir una foto directamente desde tu equipo usando el botón superior.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {filtered.map((item) => {
                const isSelected = currentSrc && (currentSrc === item.src || currentSrc.includes(item.src));
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect({ src: item.src, name: item.name });
                      onClose();
                    }}
                    className={`group relative flex flex-col overflow-hidden rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-accent ring-2 ring-accent shadow-md"
                        : "border-line bg-canvas hover:border-accent/70 hover:shadow-sm"
                    }`}
                  >
                    <div style={{ aspectRatio: "4/3", minHeight: "90px" }} className="relative aspect-[4/3] w-full min-h-[90px] overflow-hidden bg-slate-900">
                      {item.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.src}
                          alt={item.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-white">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      )}

                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white shadow">
                          ✓
                        </div>
                      )}

                      {item.tag && (
                        <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 py-0.5 text-[9px] font-medium text-white backdrop-blur-xs">
                          {item.tag}
                        </span>
                      )}
                    </div>

                    <div className="p-1.5">
                      <p className="truncate text-[11px] font-semibold text-ink group-hover:text-accent" title={item.name}>
                        {item.name}
                      </p>
                      <p className="text-[10px] text-ink-dim">
                        {item.kind === "image" ? "Imagen" : "Video"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pie de modal: opción de URL externa (secundaria/avanzada) */}
        <div className="border-t border-line px-5 py-3 bg-canvas/30">
          {!showManualUrl ? (
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] text-ink-dim">
                Mostrando {filtered.length} de {allAssets.length} fotos municipales registradas
              </span>
              <button
                type="button"
                onClick={() => setShowManualUrl(true)}
                className="text-[11px] text-ink-dim hover:text-accent underline cursor-pointer"
              >
                Ingresar enlace URL externo (avanzado)
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-ink">Enlace directo a imagen externa</label>
                <button
                  type="button"
                  onClick={() => setShowManualUrl(false)}
                  className="text-[10px] text-ink-dim hover:text-ink cursor-pointer"
                >
                  Ocultar
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="https://servidor.com/foto.jpg"
                  className="flex-1 rounded-md border border-line bg-canvas px-2.5 py-1 text-xs text-ink placeholder:text-ink-dim/60 focus:border-accent focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleApplyManualUrl}
                  disabled={!manualUrl.trim()}
                  className="rounded-md bg-accent px-3 py-1 text-xs font-semibold text-white hover:bg-accent/90 disabled:opacity-40 cursor-pointer"
                >
                  Usar URL
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
