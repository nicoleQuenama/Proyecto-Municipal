"use client";

import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { hasPermission, useAuth } from "../auth/auth-context";
import { readAsDataUrl } from "../media/image-file";
import {
  extractKeywords,
  findMediaUsage,
  matchMediaAsset,
  type MediaUsageLocation,
} from "../media/media-usage";
import { useCurrentPage, useSite, useSiteDispatch } from "../site/site-context";
import type { ProjectMediaAsset } from "../site/types";

const MUNICIPAL_STOCK_MEDIA: ProjectMediaAsset[] = [
  {
    id: "stock-alcaldia",
    name: "Atención Ciudadana y Alcaldía",
    src: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80",
    kind: "image",
    tag: "Institucional",
    tags: ["alcaldia", "atencion", "ciudadania", "gobierno"],
    createdAt: 1700000000000,
  },
  {
    id: "stock-peaton",
    name: "Actividad Día del Peatón",
    src: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80",
    kind: "image",
    tag: "Día del Peatón",
    tags: ["peaton", "dia del peaton", "bicicleta", "deporte", "movilidad", "calle"],
    createdAt: 1700000001500,
  },
  {
    id: "stock-parque",
    name: "Parque y Áreas Verdes Comunales",
    src: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80",
    kind: "image",
    tag: "Comunidad",
    tags: ["parque", "areas verdes", "medio ambiente", "arboles"],
    createdAt: 1700000001000,
  },
  {
    id: "stock-tramites",
    name: "Ventanilla y Orientación Vecinal",
    src: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80",
    kind: "image",
    tag: "Trámites",
    tags: ["tramites", "ventanilla", "servicios", "vecinos"],
    createdAt: 1700000002000,
  },
  {
    id: "stock-seguridad",
    name: "Seguridad y Patrullaje Comunitario",
    src: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80",
    kind: "image",
    tag: "Seguridad",
    tags: ["seguridad", "patrullaje", "policia", "prevencion"],
    createdAt: 1700000003000,
  },
  {
    id: "stock-obras",
    name: "Obras Públicas y Pavimentación",
    src: "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=800&q=80",
    kind: "image",
    tag: "Obras",
    tags: ["obras", "infraestructura", "pavimento", "calles"],
    createdAt: 1700000003500,
  },
  {
    id: "stock-video-comuna",
    name: "Clip Promocional Comuna Digital",
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    kind: "video",
    tag: "Institucional",
    tags: ["video", "clip", "promocion", "digital"],
    createdAt: 1700000004000,
  },
];

const COMMON_TAG_SUGGESTIONS = [
  "Día del Peatón",
  "Institucional",
  "Comunidad",
  "Obras",
  "Seguridad",
  "Trámites",
  "Salud",
  "Cultura y Deportes",
];

type MediaFilter = "all" | "image" | "video" | "stock";

export function MediaTab() {
  const [filter, setFilter] = useState<MediaFilter>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Modal para agregar por URL
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlKind, setUrlKind] = useState<"image" | "video">("image");
  const [urlName, setUrlName] = useState("");
  const [urlTag, setUrlTag] = useState("");

  // Modal inteligente de subida asistida con detección de duplicados
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTag, setUploadTag] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);

  // Modal de confirmación o borrado seguro
  const [deleteTarget, setDeleteTarget] = useState<ProjectMediaAsset | null>(null);
  const [deleteUsages, setDeleteUsages] = useState<MediaUsageLocation[]>([]);
  const [replacementAssetId, setReplacementAssetId] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const modalFileInputRef = useRef<HTMLInputElement>(null);

  const site = useSite();
  const page = useCurrentPage();
  const dispatch = useSiteDispatch();
  const { currentUser } = useAuth();
  const canEdit = hasPermission(currentUser, "editContent");
  const isSuperAdmin = currentUser?.role === "superadmin";

  const showFeedback = (text: string) => {
    setFeedback(text);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Combinar archivos subidos del proyecto con recursos de la biblioteca comunal
  const uploadedAssets = site.projectMedia ?? [];
  const allAssets = useMemo(() => {
    return filter === "stock"
      ? MUNICIPAL_STOCK_MEDIA
      : [...uploadedAssets, ...(filter === "all" ? MUNICIPAL_STOCK_MEDIA : [])];
  }, [uploadedAssets, filter]);

  // Lista única de etiquetas disponibles en los medios actuales para el selector de filtros
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

  // Filtrado reactivo por tipo, etiqueta seleccionada y texto de búsqueda
  const filtered = useMemo(() => {
    return allAssets.filter((item) => {
      if (filter === "image" && item.kind !== "image") return false;
      if (filter === "video" && item.kind !== "video") return false;

      // Filtro de etiqueta estricta si el usuario pulsó una pill de etiqueta
      if (selectedTag) {
        const matchesMainTag = item.tag?.toLowerCase() === selectedTag.toLowerCase();
        const matchesExtraTags = item.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
        if (!matchesMainTag && !matchesExtraTags) return false;
      }

      // Buscador inteligente por nombre o etiquetas
      if (query.trim() && !matchMediaAsset(query, item)) {
        return false;
      }

      return true;
    });
  }, [allAssets, filter, selectedTag, query]);

  // Coincidencias en tiempo real dentro del modal de subida al escribir una etiqueta
  const duplicateMatchesInUpload = useMemo(() => {
    if (!uploadTag.trim() || uploadTag.trim().length < 2) return [];
    return allAssets.filter((item) => matchMediaAsset(uploadTag, item));
  }, [allAssets, uploadTag]);

  // Abrir modal de subida asistida
  const handleOpenUploadModal = () => {
    setUploadTag("");
    setUploadTitle("");
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setUploadModalOpen(true);
  };

  const handleModalFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      showFeedback(`Formato no compatible: ${file.name}`);
      return;
    }

    try {
      const dataUrl = await readAsDataUrl(file);
      setPendingFile(file);
      setPendingPreviewUrl(dataUrl);
      if (!uploadTitle.trim()) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    } catch {
      showFeedback(`Error al leer archivo ${file.name}`);
    }
  };

  // Subir el archivo confirmado desde el modal
  const handleCommitUploadModal = () => {
    if (!pendingFile || !pendingPreviewUrl || !canEdit) return;

    const isVideo = pendingFile.type.startsWith("video/");
    const cleanTag = uploadTag.trim() || "General";
    const derivedKeywords = Array.from(new Set([cleanTag.toLowerCase(), ...extractKeywords(cleanTag)]));
    const title = uploadTitle.trim() || pendingFile.name.replace(/\.[^/.]+$/, "");

    const newAsset: ProjectMediaAsset = {
      id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: title,
      src: pendingPreviewUrl,
      kind: isVideo ? "video" : "image",
      size: pendingFile.size,
      tag: cleanTag,
      tags: derivedKeywords,
      createdAt: Date.now(),
      local: true,
    };

    dispatch({ type: "project-media/add", asset: newAsset });
    setUploadModalOpen(false);
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setUploadTag("");
    setUploadTitle("");
    showFeedback(`Subido y catalogado en «${cleanTag}»`);
  };

  // Drag and drop rápido sobre la zona principal
  const handleDirectDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!canEdit) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) return;

      try {
        const dataUrl = await readAsDataUrl(file);
        setPendingFile(file);
        setPendingPreviewUrl(dataUrl);
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
        setUploadTag(selectedTag || "Comunidad");
        setUploadModalOpen(true);
      } catch {
        showFeedback(`Error al procesar archivo`);
      }
    }
  };

  // Agregar recurso mediante URL
  const handleAddByUrl = () => {
    if (!urlInput.trim() || !canEdit) return;
    const cleanUrl = urlInput.trim();
    const isVideo =
      urlKind === "video" ||
      cleanUrl.includes(".mp4") ||
      cleanUrl.includes("youtube") ||
      cleanUrl.includes("vimeo");
    const name = urlName.trim() || (isVideo ? "Video externo" : "Imagen externa");
    const cleanTag = urlTag.trim() || "General";
    const derivedKeywords = Array.from(new Set([cleanTag.toLowerCase(), ...extractKeywords(cleanTag)]));

    const newAsset: ProjectMediaAsset = {
      id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      src: cleanUrl,
      kind: isVideo ? "video" : "image",
      tag: cleanTag,
      tags: derivedKeywords,
      createdAt: Date.now(),
      local: false,
    };

    dispatch({ type: "project-media/add", asset: newAsset });
    setUrlInput("");
    setUrlName("");
    setUrlTag("");
    setUrlModalOpen(false);
    showFeedback(`Agregado a la biblioteca`);
  };

  // Aplicar imagen/video al elemento actualmente seleccionado en el lienzo
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

    // 2. Si no hay elemento seleccionado, agregar como medio suelto de página
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

  // Usar como fondo de página
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

  // Inicio de proceso de borrado seguro con verificación de uso en tiempo real
  const handleRequestDelete = (asset: ProjectMediaAsset) => {
    if (!canEdit) return;
    if (!isSuperAdmin) {
      showFeedback("Solo los administradores pueden eliminar imágenes de la biblioteca global");
      return;
    }

    const usages = findMediaUsage(site, asset.src);
    setDeleteTarget(asset);
    setDeleteUsages(usages);
    setReplacementAssetId(null);
  };

  // Confirmar borrado seguro cuando la imagen NO está en uso
  const handleConfirmDirectDelete = () => {
    if (!deleteTarget) return;
    dispatch({ type: "project-media/remove", id: deleteTarget.id });
    setDeleteTarget(null);
    setDeleteUsages([]);
    showFeedback("Archivo eliminado de la biblioteca");
  };

  // Reemplazar la imagen en todas las páginas donde se usaba y luego eliminar la anterior
  const handleConfirmReplacementAndDelete = () => {
    if (!deleteTarget || !replacementAssetId) return;

    const replacementAsset = allAssets.find((a) => a.id === replacementAssetId);
    if (!replacementAsset) return;

    // 1. Reemplaza la URL en todas las páginas, fondos y bloques del sitio
    dispatch({
      type: "project-media/replace",
      oldSrc: deleteTarget.src,
      newSrc: replacementAsset.src,
      newAlt: replacementAsset.name,
    });

    // 2. Elimina el archivo anterior de la biblioteca
    dispatch({ type: "project-media/remove", id: deleteTarget.id });

    setDeleteTarget(null);
    setDeleteUsages([]);
    setReplacementAssetId(null);
    showFeedback("Imagen reemplazada en todas las páginas y eliminada con éxito");
  };

  return (
    <div className="flex flex-col gap-3.5">
      {/* Botones principales de subida y enlaces */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={!canEdit}
          onClick={handleOpenUploadModal}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-accent text-xs font-semibold text-white shadow-xs transition-all hover:bg-accent/90 active:scale-95 disabled:opacity-50"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Subir archivos con etiqueta
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

      {/* Zona de soltar (Drag and drop rápido) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDirectDrop}
        className={`flex flex-col items-center justify-center rounded-xl border border-dashed py-3 px-3 text-center transition-all ${
          isDragging
            ? "border-accent bg-accent/10 text-accent scale-[1.01]"
            : "border-line bg-canvas/30 text-ink-dim hover:border-accent/40"
        }`}
      >
        <p className="text-[11px] font-medium">Arrastra una imagen o video para clasificarlo y subirlo</p>
        <p className="text-[10px] text-ink-dim/80">Reutiliza etiquetas para que otros usuarios no dupliquen fotos</p>
      </div>

      {/* Modal / formulario inline para agregar por URL */}
      {urlModalOpen && (
        <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-canvas/90 p-3 text-xs shadow-sm">
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
            placeholder="Etiqueta temática (ej. Día del Peatón, Obras)"
            value={urlTag}
            onChange={(e) => setUrlTag(e.target.value)}
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

      {/* Buscador inteligente */}
      <div className="flex h-8 items-center gap-2 rounded-md bg-canvas px-2.5 border border-line focus-within:ring-1 focus-within:ring-accent">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-dim">
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5L14 14" />
        </svg>
        <input
          type="search"
          aria-label="Buscar en biblioteca"
          placeholder="Buscar por etiqueta o palabra (ej. peaton, obras)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-ink-dim"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-xs text-ink-dim hover:text-ink font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filtros de pestañas principales (Tipo de recurso) */}
      <div className="flex rounded-lg bg-canvas p-1 border border-line">
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

      {/* Pills de etiquetas disponibles para reciclaje rápido */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-ink-dim">
          <span>Categorías y etiquetas:</span>
          {selectedTag && (
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className="text-accent hover:underline font-medium lowercase"
            >
              ver todas
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-0.5">
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
              selectedTag === null
                ? "bg-accent text-white shadow-xs"
                : "border border-line bg-canvas text-ink hover:bg-hover"
            }`}
          >
            Todas
          </button>
          {availableTags.map((tag) => {
            const active = selectedTag?.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(active ? null : tag)}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                  active
                    ? "bg-accent text-white shadow-xs"
                    : "border border-line bg-canvas text-ink hover:bg-hover hover:border-accent/40"
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
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
          <span>
            {filtered.length} {filtered.length === 1 ? "archivo" : "archivos"}
            {selectedTag ? ` en #${selectedTag}` : ""}
          </span>
          {site.selectedElementId && (
            <span className="text-accent font-medium">Elemento listo para reemplazar</span>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-canvas/30 py-8 px-4 text-center">
            <p className="text-xs text-ink-dim">No se encontraron archivos con esos criterios</p>
            <p className="text-[11px] text-ink-dim/70 mt-1">Usa el botón de subida para registrar nuevas fotos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-0.5">
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
                    title="Haz clic para aplicar al elemento seleccionado o insertar"
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

                        {!isStock && isSuperAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestDelete(item);
                            }}
                            title="Eliminar de forma segura de la biblioteca"
                            className="rounded bg-red-500/80 p-1 text-[10px] text-white hover:bg-red-500"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nombre y etiqueta del archivo */}
                  <div className="p-1.5 flex flex-col gap-0.5">
                    <p className="truncate text-[11px] font-medium text-ink" title={item.name}>
                      {item.name}
                    </p>
                    {item.tag && (
                      <span className="truncate text-[10px] font-semibold text-accent" title={`#${item.tag}`}>
                        #{item.tag}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL INTELIGENTE DE SUBIDA CON DETECCIÓN DE SIMILARES/DUPLICADOS POR TAG */}
      {/* ========================================================================= */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-canvas shadow-2xl">
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between border-b border-line px-4 py-3 bg-canvas/90">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-ink">Subir archivo a la biblioteca municipal</span>
                <span className="text-[11px] text-ink-dim">Etiqueta tu archivo para que otros usuarios puedan encontrarlo y reutilizarlo</span>
              </div>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="flex flex-col gap-4 overflow-y-auto p-4 text-xs">
              {/* Paso 1: Escribir o elegir etiqueta */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="upload-tag-field" className="font-semibold text-ink">
                  1. Etiqueta o tema de la imagen <span className="text-accent">*</span>
                </label>
                <input
                  id="upload-tag-field"
                  type="text"
                  placeholder="Ej. Día del Peatón, Obras, Seguridad, Actividades..."
                  value={uploadTag}
                  onChange={(e) => setUploadTag(e.target.value)}
                  className="h-9 rounded-lg border border-line bg-canvas px-3 text-xs text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />

                {/* Sugerencias rápidas de etiquetas */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[10px] text-ink-dim">Sugerencias:</span>
                  {COMMON_TAG_SUGGESTIONS.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setUploadTag(st)}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                        uploadTag.toLowerCase() === st.toLowerCase()
                          ? "bg-accent text-white"
                          : "bg-canvas border border-line text-ink-dim hover:text-ink hover:bg-hover"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detección en vivo de fotos similares existentes */}
              {duplicateMatchesInUpload.length > 0 && (
                <div className="flex flex-col gap-2 rounded-xl border border-accent/40 bg-accent/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-ink">
                      Ya existen {duplicateMatchesInUpload.length} {duplicateMatchesInUpload.length === 1 ? "foto relacionada" : "fotos relacionadas"} con «{uploadTag}»:
                    </span>
                    <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                      Recicla y ahorra espacio
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-dim leading-snug">
                    Revisa si la imagen que necesitas ya fue subida por otra unidad municipal para evitar duplicados:
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-1 max-h-40 overflow-y-auto">
                    {duplicateMatchesInUpload.map((match) => (
                      <div
                        key={match.id}
                        className="group relative flex flex-col overflow-hidden rounded-md border border-line bg-canvas"
                      >
                        <div className="relative aspect-4/3 w-full bg-slate-900">
                          {match.kind === "image" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={match.src} alt={match.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-white text-xs">Video</div>
                          )}
                        </div>
                        <div className="p-1">
                          <p className="truncate text-[10px] font-medium text-ink" title={match.name}>
                            {match.name}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            handleApplyToSelection(match);
                            setUploadModalOpen(false);
                          }}
                          className="w-full bg-accent py-1 text-[10px] font-semibold text-white hover:bg-accent/90"
                        >
                          Usar esta foto
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Paso 2: Selección del archivo y título */}
              <div className="flex flex-col gap-2 pt-1 border-t border-line">
                <span className="font-semibold text-ink">
                  2. Si es una foto nueva, selecciónala aquí:
                </span>

                <input
                  ref={modalFileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleModalFileSelected}
                  className="hidden"
                />

                {!pendingPreviewUrl ? (
                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-canvas/40 py-6 text-center hover:border-accent hover:bg-accent/5 transition-all"
                  >
                    <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent mb-1.5">
                      <path d="M8 3v10M3 8h10" />
                    </svg>
                    <span className="font-semibold text-ink">Hacer clic para elegir archivo</span>
                    <span className="text-[10px] text-ink-dim">PNG, JPG, WebP, SVG o MP4</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-line bg-canvas p-2.5">
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-slate-900 shrink-0">
                      {pendingFile?.type.startsWith("video/") ? (
                        <div className="flex h-full w-full items-center justify-center text-white text-xs">Video</div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pendingPreviewUrl} alt="Vista previa" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{pendingFile?.name}</p>
                      <p className="text-[10px] text-ink-dim">
                        {pendingFile ? `${Math.round(pendingFile.size / 1024)} KB` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingFile(null);
                        setPendingPreviewUrl(null);
                      }}
                      className="rounded p-1 text-ink-dim hover:text-red-500 font-bold"
                      title="Quitar archivo"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex flex-col gap-1 pt-1">
                  <label htmlFor="upload-title-field" className="text-[11px] font-medium text-ink-dim">
                    Nombre o título descriptivo de la imagen:
                  </label>
                  <input
                    id="upload-title-field"
                    type="text"
                    placeholder="Ej. Apertura Día del Peatón en Plaza Central"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="h-8 rounded-md border border-line bg-canvas px-2.5 text-xs text-ink outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {/* Pie del modal */}
            <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3 bg-canvas/90">
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-dim hover:bg-hover hover:text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!pendingFile || !pendingPreviewUrl}
                onClick={handleCommitUploadModal}
                className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-accent/90 disabled:opacity-50"
              >
                Subir y registrar con etiqueta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE SEGURIDAD Y REEMPLAZO OBLIGATORIO PARA BORRADO SEGURO */}
      {/* ========================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-canvas shadow-2xl">
            {/* Cabecera */}
            <div className="flex items-center justify-between border-b border-line px-4 py-3 bg-canvas/90">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-ink">
                  {deleteUsages.length > 0 ? "Atención: Imagen en uso en la web" : "Eliminar archivo de la biblioteca"}
                </span>
                <span className="text-[11px] text-ink-dim">{deleteTarget.name}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteUsages([]);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Contenido */}
            <div className="flex flex-col gap-3.5 overflow-y-auto p-4 text-xs">
              {deleteUsages.length === 0 ? (
                /* CASO 1: NO ESTÁ EN USO -> BORRADO DIRECTO SEGURO */
                <div className="flex flex-col gap-2">
                  <p className="text-ink leading-relaxed">
                    Esta imagen no está en uso en ninguna página ni sección del sitio. Es seguro eliminarla de la biblioteca.
                  </p>
                  <div className="flex items-center gap-2.5 rounded-lg border border-line bg-canvas p-2">
                    <div className="h-14 w-14 overflow-hidden rounded bg-slate-900 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={deleteTarget.src} alt={deleteTarget.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1 text-[11px]">
                      <p className="font-semibold text-ink">{deleteTarget.name}</p>
                      <p className="text-ink-dim">Etiqueta: #{deleteTarget.tag || "General"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* CASO 2: ESTÁ EN USO -> ASISTENTE DE REEMPLAZO OBLIGATORIO */
                <div className="flex flex-col gap-3">
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-200">
                    <p className="font-semibold text-[12px] mb-1">
                      Esta imagen está activa actualmente en {deleteUsages.length} {deleteUsages.length === 1 ? "lugar" : "lugares"} del portal:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                      {deleteUsages.map((usage, idx) => (
                        <li key={idx}>
                          Página <span className="font-semibold">{usage.pageName}</span>
                          {usage.blockName ? ` → Bloque ${usage.blockName}` : ""}
                          {usage.type === "page-backdrop" ? " (Fondo de página)" : ""}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] mt-2 font-medium">
                      Si la eliminas sin sustituirla, esas secciones quedarán en blanco o con imágenes rotas.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="font-semibold text-ink">
                      Selecciona una imagen de reemplazo para actualizar todas esas páginas automáticamente:
                    </span>

                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-0.5">
                      {allAssets
                        .filter((a) => a.id !== deleteTarget.id && a.kind === deleteTarget.kind)
                        .map((candidate) => {
                          const selected = replacementAssetId === candidate.id;
                          return (
                            <button
                              key={candidate.id}
                              type="button"
                              onClick={() => setReplacementAssetId(candidate.id)}
                              className={`flex flex-col overflow-hidden rounded-lg border text-left transition-all ${
                                selected
                                  ? "border-accent ring-2 ring-accent bg-accent/10"
                                  : "border-line bg-canvas hover:border-ink/30"
                              }`}
                            >
                              <div className="aspect-4/3 w-full bg-slate-900">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={candidate.src} alt={candidate.name} className="h-full w-full object-cover" />
                              </div>
                              <div className="p-1">
                                <p className="truncate text-[10px] font-medium text-ink">{candidate.name}</p>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pie del modal */}
            <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3 bg-canvas/90">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteUsages([]);
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-dim hover:bg-hover hover:text-ink"
              >
                Cancelar y conservar
              </button>

              {deleteUsages.length === 0 ? (
                <button
                  type="button"
                  onClick={handleConfirmDirectDelete}
                  className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-red-700"
                >
                  Eliminar archivo
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!replacementAssetId}
                  onClick={handleConfirmReplacementAndDelete}
                  className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-accent/90 disabled:opacity-50"
                >
                  Reemplazar en páginas y eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
