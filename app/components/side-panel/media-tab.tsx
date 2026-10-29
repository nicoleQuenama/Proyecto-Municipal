"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { hasPermission, useAuth } from "../auth/auth-context";
import { readAsDataUrl } from "../media/image-file";
import { useCurrentPage, useSite, useSiteDispatch } from "../site/site-context";
import type { ProjectMediaAsset } from "../site/types";

const MUNICIPAL_STOCK_MEDIA: ProjectMediaAsset[] = [
  {
    id: "stock-alcaldia",
    name: "Atención Ciudadana y Alcaldía",
    src: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80",
    kind: "image",
    tag: "Institucional",
    createdAt: 1700000000000,
  },
  {
    id: "stock-parque",
    name: "Parque y Áreas Verdes Comunales",
    src: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80",
    kind: "image",
    tag: "Comunidad",
    createdAt: 1700000001000,
  },
  {
    id: "stock-tramites",
    name: "Ventanilla y Orientación Vecinal",
    src: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80",
    kind: "image",
    tag: "Trámites",
    createdAt: 1700000002000,
  },
  {
    id: "stock-seguridad",
    name: "Seguridad y Patrullaje Comunitario",
    src: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80",
    kind: "image",
    tag: "Seguridad",
    createdAt: 1700000003000,
  },
  {
    id: "stock-video-comuna",
    name: "Clip Promocional Comuna Digital",
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    kind: "video",
    tag: "Video",
    createdAt: 1700000004000,
  },
];

type MediaFilter = "all" | "image" | "video" | "stock";

export function MediaTab() {
  const [filter, setFilter] = useState<MediaFilter>("all");
  const [query, setQuery] = useState("");
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlKind, setUrlKind] = useState<"image" | "video">("image");
  const [urlName, setUrlName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const site = useSite();
  const page = useCurrentPage();
  const dispatch = useSiteDispatch();
  const { currentUser } = useAuth();
  const canEdit = hasPermission(currentUser, "editContent");

  const showFeedback = (text: string) => {
    setFeedback(text);
    setTimeout(() => setFeedback(null), 2500);
  };

  // Combinar archivos subidos del proyecto con recursos de la biblioteca de ejemplo
  const uploadedAssets = site.projectMedia ?? [];
  const allAssets = filter === "stock"
    ? MUNICIPAL_STOCK_MEDIA
    : [...uploadedAssets, ...(filter === "all" ? MUNICIPAL_STOCK_MEDIA : [])];

  const filtered = allAssets.filter((item) => {
    if (filter === "image" && item.kind !== "image") return false;
    if (filter === "video" && item.kind !== "video") return false;
    if (query.trim() && !item.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
    return true;
  });

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !canEdit) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");
        if (!isVideo && !isImage) {
          showFeedback(`Formato no compatible: ${file.name}`);
          continue;
        }

        const dataUrl = await readAsDataUrl(file);
        const newAsset: ProjectMediaAsset = {
          id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name.replace(/\.[^/.]+$/, ""),
          src: dataUrl,
          kind: isVideo ? "video" : "image",
          size: file.size,
          createdAt: Date.now(),
          local: true,
        };

        dispatch({ type: "project-media/add", asset: newAsset });
        showFeedback(`Subido: ${file.name}`);
      } catch (err) {
        showFeedback(`Error al cargar ${file.name}`);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!canEdit) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");
        if (!isVideo && !isImage) continue;

        try {
          const dataUrl = await readAsDataUrl(file);
          const newAsset: ProjectMediaAsset = {
            id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name.replace(/\.[^/.]+$/, ""),
            src: dataUrl,
            kind: isVideo ? "video" : "image",
            size: file.size,
            createdAt: Date.now(),
            local: true,
          };
          dispatch({ type: "project-media/add", asset: newAsset });
          showFeedback(`Subido: ${file.name}`);
        } catch {
          showFeedback(`Error al procesar ${file.name}`);
        }
      }
    }
  };

  const handleAddByUrl = () => {
    if (!urlInput.trim() || !canEdit) return;
    const cleanUrl = urlInput.trim();
    const isVideo = urlKind === "video" || cleanUrl.includes(".mp4") || cleanUrl.includes("youtube") || cleanUrl.includes("vimeo");
    const name = urlName.trim() || (isVideo ? "Video externo" : "Imagen externa");

    const newAsset: ProjectMediaAsset = {
      id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      src: cleanUrl,
      kind: isVideo ? "video" : "image",
      createdAt: Date.now(),
      local: false,
    };

    dispatch({ type: "project-media/add", asset: newAsset });
    setUrlInput("");
    setUrlName("");
    setUrlModalOpen(false);
    showFeedback(`Agregado a la biblioteca`);
  };

  const handleApplyToSelection = (asset: ProjectMediaAsset) => {
    if (!canEdit) return;

    // 1. Si hay un elemento seleccionado en el editor:
    if (site.selectedId && site.selectedElementId) {
      const activeBlock = page.blocks.find((b) => b.id === site.selectedId);
      if (activeBlock) {
        if (asset.kind === "image") {
          dispatch({
            type: "block/style",
            pageId: page.id,
            blockId: activeBlock.id,
            elementIds: [site.selectedElementId],
            patch: { src: asset.src, alt: asset.name },
          });
          showFeedback("Imagen aplicada al elemento seleccionado");
          return;
        }
        if (asset.kind === "video") {
          dispatch({
            type: "block/style",
            pageId: page.id,
            blockId: activeBlock.id,
            elementIds: [site.selectedElementId],
            patch: { src: asset.src },
          });
          showFeedback("Video aplicado al elemento seleccionado");
          return;
        }
      }
    }

    // 2. Si no hay elemento seleccionado, agregar como medio de página
    dispatch({
      type: "media/add",
      item: {
        id: crypto.randomUUID(),
        kind: asset.kind,
        name: asset.name,
        src: asset.src,
        embed: false,
        local: Boolean(asset.local),
        alt: asset.name,
      },
    });
    showFeedback("Agregado al lienzo de la página actual");
  };

  const handleSetAsPageBackground = (asset: ProjectMediaAsset) => {
    if (!canEdit || asset.kind !== "image") return;
    dispatch({
      type: "page/backdrop",
      pageId: page.id,
      backdrop: {
        kind: "image",
        src: asset.src,
        fit: "cover",
        anchor: "mc",
        fixed: false,
        blur: 0,
      },
    });
    showFeedback("Fondo de página actualizado");
  };

  const handleDelete = (assetId: string) => {
    if (!canEdit) return;
    dispatch({ type: "project-media/remove", id: assetId });
    showFeedback("Elemento eliminado de la biblioteca");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Botones principales tipo Canva */}
      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => fileInputRef.current?.click()}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-accent text-xs font-semibold text-white shadow-xs transition-all hover:bg-accent/90 active:scale-95 disabled:opacity-50"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Subir archivos
        </button>

        <button
          type="button"
          disabled={!canEdit}
          onClick={() => setUrlModalOpen(true)}
          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-canvas/60 text-xs font-medium text-ink transition-colors hover:bg-hover active:scale-95 disabled:opacity-50"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-dim">
            <path d="M6.5 9.5a3 3 0 004.2 0l2.1-2.1a3 3 0 00-4.2-4.2L7.5 4.3" />
            <path d="M9.5 6.5a3 3 0 00-4.2 0L3.2 8.6a3 3 0 004.2 4.2l1.1-1.1" />
          </svg>
          Agregar desde enlace URL
        </button>
      </div>

      {/* Zona de soltar (Drag and drop) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-xl border border-dashed py-3.5 px-3 text-center transition-all ${
          isDragging
            ? "border-accent bg-accent/10 text-accent scale-[1.01]"
            : "border-line bg-canvas/30 text-ink-dim hover:border-accent/40"
        }`}
      >
        <p className="text-[11px] font-medium">Arrastra imágenes o videos aquí para subirlos</p>
        <p className="text-[10px] text-ink-dim/80">Formatos PNG, JPG, WebP, SVG o MP4</p>
      </div>

      {/* Modal / formulario inline para agregar por URL */}
      {urlModalOpen && (
        <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-canvas/80 p-3 text-xs shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-ink">Agregar por enlace URL</span>
            <button
              type="button"
              onClick={() => setUrlModalOpen(false)}
              className="text-ink-dim hover:text-ink text-sm font-bold"
            >
              ✕
            </button>
          </div>
          <div className="flex rounded-md bg-canvas p-0.5">
            <button
              type="button"
              onClick={() => setUrlKind("image")}
              className={`flex-1 rounded py-1 text-[11px] font-medium ${
                urlKind === "image" ? "bg-accent text-white" : "text-ink-dim hover:text-ink"
              }`}
            >
              Imagen
            </button>
            <button
              type="button"
              onClick={() => setUrlKind("video")}
              className={`flex-1 rounded py-1 text-[11px] font-medium ${
                urlKind === "video" ? "bg-accent text-white" : "text-ink-dim hover:text-ink"
              }`}
            >
              Video
            </button>
          </div>
          <input
            type="url"
            placeholder={urlKind === "image" ? "https://ejemplo.com/foto.jpg" : "https://ejemplo.com/video.mp4"}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="h-8 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent"
          />
          <input
            type="text"
            placeholder="Nombre o descripción (opcional)"
            value={urlName}
            onChange={(e) => setUrlName(e.target.value)}
            className="h-8 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent"
          />
          <div className="flex justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setUrlModalOpen(false)}
              className="rounded px-2.5 py-1 text-xs text-ink-dim hover:text-ink"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddByUrl}
              disabled={!urlInput.trim()}
              className="rounded bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-50"
            >
              Guardar en Media
            </button>
          </div>
        </div>
      )}

      {/* Filtros de pestañas tipo Canva */}
      <div className="flex rounded-lg bg-canvas p-1">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`flex-1 rounded-md py-1 text-[11px] font-medium transition-all ${
            filter === "all" ? "bg-accent text-white shadow-xs" : "text-ink-dim hover:text-ink"
          }`}
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => setFilter("image")}
          className={`flex-1 rounded-md py-1 text-[11px] font-medium transition-all ${
            filter === "image" ? "bg-accent text-white shadow-xs" : "text-ink-dim hover:text-ink"
          }`}
        >
          Imágenes
        </button>
        <button
          type="button"
          onClick={() => setFilter("video")}
          className={`flex-1 rounded-md py-1 text-[11px] font-medium transition-all ${
            filter === "video" ? "bg-accent text-white shadow-xs" : "text-ink-dim hover:text-ink"
          }`}
        >
          Videos
        </button>
        <button
          type="button"
          onClick={() => setFilter("stock")}
          className={`flex-1 rounded-md py-1 text-[11px] font-medium transition-all ${
            filter === "stock" ? "bg-accent text-white shadow-xs" : "text-ink-dim hover:text-ink"
          }`}
        >
          Comunal
        </button>
      </div>

      {/* Buscador de archivos */}
      <div className="flex h-8 items-center gap-2 rounded-md bg-canvas px-2.5 focus-within:ring-1 focus-within:ring-accent">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-dim">
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5L14 14" />
        </svg>
        <input
          type="search"
          aria-label="Buscar en archivos"
          placeholder="Buscar archivo por nombre…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-ink-dim"
        />
      </div>

      {/* Notificación de feedback */}
      {feedback && (
        <div role="status" className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1.5 text-[11px] font-medium text-emerald-600">
          {feedback}
        </div>
      )}

      {/* Galería de archivos (Grid 2 columnas tipo Canva) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] text-ink-dim">
          <span>{filtered.length} {filtered.length === 1 ? "archivo" : "archivos"}</span>
          {site.selectedElementId && (
            <span className="text-accent font-medium">Elemento seleccionado listo para reemplazar</span>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-canvas/30 py-8 px-4 text-center">
            <p className="text-xs text-ink-dim">No hay archivos en esta categoría</p>
            <p className="text-[11px] text-ink-dim/70 mt-1">Sube tus fotos o videos con el botón superior</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 max-h-[480px] overflow-y-auto pr-0.5">
            {filtered.map((item) => {
              const isStock = item.id.startsWith("stock-");
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/x-cms-media", item.src);
                    e.dataTransfer.setData("text/uri-list", item.src);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  className="group relative flex flex-col overflow-hidden rounded-lg border border-line bg-canvas transition-all hover:border-accent hover:shadow-md"
                >
                  {/* Vista previa miniatura */}
                  <div
                    onClick={() => handleApplyToSelection(item)}
                    title="Haz clic para aplicar o insertar"
                    className="relative aspect-4/3 w-full cursor-pointer overflow-hidden bg-slate-900"
                  >
                    {item.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.src}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-950 text-white">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}

                    {/* Badge de tipo */}
                    <span className="absolute top-1.5 left-1.5 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold text-white uppercase backdrop-blur-xs">
                      {item.kind === "image" ? "IMG" : "VID"}
                    </span>

                    {/* Acciones en hover */}
                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyToSelection(item);
                          }}
                          title={site.selectedElementId ? "Aplicar a elemento seleccionado" : "Insertar en lienzo"}
                          className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-accent/90"
                        >
                          {site.selectedElementId ? "Reemplazar" : "Insertar"}
                        </button>

                        {item.kind === "image" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetAsPageBackground(item);
                            }}
                            title="Usar como fondo de página"
                            className="rounded bg-white/20 p-1 text-[10px] text-white hover:bg-white/40"
                          >
                            Fondo
                          </button>
                        )}

                        {!isStock && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            title="Eliminar de la biblioteca"
                            className="rounded bg-red-500/80 p-1 text-[10px] text-white hover:bg-red-500"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nombre del archivo */}
                  <div className="p-1.5">
                    <p className="truncate text-[11px] font-medium text-ink" title={item.name}>
                      {item.name}
                    </p>
                    {item.tag && (
                      <span className="text-[10px] text-ink-dim">{item.tag}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
