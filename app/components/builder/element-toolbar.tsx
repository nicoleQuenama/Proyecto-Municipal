"use client";

import { useState, type ReactNode } from "react";
import type { CanvasElement, ElementKind } from "../site/types";
import { IconGlyph } from "../icons/icon-glyph";
import { EllipseIcon, ImageIcon, RectangleIcon, TextIcon, VideoIcon } from "../viewport/icons";

interface ToolItem {
  id: string;
  kind: ElementKind;
  category: "frames" | "shapes" | "text" | "media";
  label: string;
  desc: string;
  badge?: string;
  icon: ReactNode;
  overrides?: Partial<CanvasElement>;
}

const TOOLS: ToolItem[] = [
  // Marcos (estilo Canva)
  {
    id: "frame-circle",
    kind: "ellipse",
    category: "frames",
    label: "Marco Circular",
    desc: "Avatar o foto redonda con recorte",
    badge: "Canva",
    icon: (
      <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-sky-400 bg-sky-500/10 text-sky-400">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      </div>
    ),
    overrides: { width: 130, height: 130, fill: "#e0f2fe", role: "image", frame: true },
  },
  {
    id: "frame-rect",
    kind: "rect",
    category: "frames",
    label: "Marco Rectangular",
    desc: "Foto de tarjeta con bordes curvos",
    badge: "Canva",
    icon: (
      <div className="flex h-7 w-8 items-center justify-center rounded-lg border-2 border-dashed border-sky-400 bg-sky-500/10 text-sky-400">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      </div>
    ),
    overrides: { width: 260, height: 160, radius: 12, fill: "#e0f2fe", role: "image", frame: true },
  },
  {
    id: "frame-square",
    kind: "rect",
    category: "frames",
    label: "Marco Cuadrado",
    desc: "Miniatura o foto cuadrada 1:1",
    badge: "Canva",
    icon: (
      <div className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-dashed border-sky-400 bg-sky-500/10 text-sky-400">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      </div>
    ),
    overrides: { width: 140, height: 140, radius: 16, fill: "#e0f2fe", role: "image", frame: true },
  },

  // Formas básicas
  {
    id: "shape-container",
    kind: "rect",
    category: "shapes",
    label: "Caja Contenedor",
    desc: "Fondo para agrupar elementos",
    icon: <RectangleIcon />,
    overrides: { width: 320, height: 180, fill: "#f8fafc", radius: 12, role: "container" },
  },
  {
    id: "shape-rect",
    kind: "rect",
    category: "shapes",
    label: "Rectángulo",
    desc: "Figura plana configurable",
    icon: <RectangleIcon />,
    overrides: { width: 140, height: 80, fill: "#cbd5e1", radius: 8 },
  },
  {
    id: "shape-ellipse",
    kind: "ellipse",
    category: "shapes",
    label: "Círculo / Elipse",
    desc: "Figura circular o elíptica",
    icon: <EllipseIcon />,
    overrides: { width: 90, height: 90, fill: "#cbd5e1" },
  },
  {
    id: "shape-line",
    kind: "line",
    category: "shapes",
    label: "Línea Divisoria",
    desc: "Separador de contenido",
    icon: (
      <div className="flex h-5 w-6 items-center justify-center">
        <div className="h-0.5 w-full bg-current rounded" />
      </div>
    ),
    overrides: { width: 260, height: 2, fill: "#cbd5e1" },
  },

  // Texto y Botones
  {
    id: "text-heading",
    kind: "text",
    category: "text",
    label: "Título Principal",
    desc: "Encabezado destacado H1/H2",
    icon: (
      <span className="font-bold text-sm text-accent">H1</span>
    ),
    overrides: { width: 260, height: 36, text: "Título del Componente", fontSize: 22, bold: true, role: "heading" },
  },
  {
    id: "text-paragraph",
    kind: "text",
    category: "text",
    label: "Párrafo de Texto",
    desc: "Texto informativo o descriptivo",
    icon: <TextIcon />,
    overrides: { width: 280, height: 48, text: "Descripción detallada del trámite o servicio municipal.", fontSize: 13, role: "text" },
  },
  {
    id: "text-button",
    kind: "rect",
    category: "text",
    label: "Botón de Acción",
    desc: "Botón interactivo con llamada",
    icon: (
      <div className="flex h-5 w-7 items-center justify-center rounded bg-accent text-[9px] font-bold text-white">
        CTA
      </div>
    ),
    overrides: {
      width: 160,
      height: 42,
      fill: "#0d99ff",
      radius: 8,
      text: "Iniciar trámite →",
      color: "#ffffff",
      bold: true,
      align: "center",
      fontSize: 13,
      role: "button",
    },
  },

  // Medios
  {
    id: "media-image",
    kind: "image",
    category: "media",
    label: "Imagen Directa",
    desc: "Foto sin máscara de forma",
    icon: <ImageIcon />,
    overrides: { width: 220, height: 140 },
  },
  {
    id: "media-icon",
    kind: "icon",
    category: "media",
    label: "Ícono SVG",
    desc: "Ícono vectorial comunal",
    icon: <IconGlyph name="star" size={18} />,
    overrides: { width: 36, height: 36, fontSize: 28, icon: "star", color: "#0d99ff" },
  },
  {
    id: "media-video",
    kind: "video",
    category: "media",
    label: "Video",
    desc: "Reproductor YouTube o archivo",
    icon: <VideoIcon />,
    overrides: { width: 280, height: 160 },
  },
];

type CategoryFilter = "all" | "frames" | "shapes" | "text" | "media";

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "frames", label: "Marcos" },
  { id: "shapes", label: "Formas" },
  { id: "text", label: "Texto" },
  { id: "media", label: "Medios" },
];

interface ElementToolbarProps {
  onAdd: (kind: ElementKind, overrides?: Partial<CanvasElement>) => void;
}

/** Barra lateral izquierda del constructor: herramientas visuales categorizadas y claras tipo Canva. */
export function ElementToolbar({ onAdd }: ElementToolbarProps) {
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");

  const filtered = TOOLS.filter((tool) => {
    const matchesCategory = filter === "all" || tool.category === filter;
    const matchesQuery =
      !query.trim() ||
      tool.label.toLowerCase().includes(query.toLowerCase()) ||
      tool.desc.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <aside aria-label="Herramientas de elementos" className="flex h-full flex-col border-r border-line bg-panel/30">
      <div className="border-b border-line p-3">
        <h3 className="mb-2 text-xs font-semibold text-ink">Elementos y Marcos</h3>
        
        {/* Buscador de herramientas */}
        <div className="mb-2.5 flex h-7 items-center gap-1.5 rounded-md bg-canvas px-2 text-xs border border-line focus-within:border-accent">
          <span className="text-ink-dim">⌕</span>
          <input
            type="search"
            placeholder="Buscar elemento…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-[11px] outline-none placeholder:text-ink-dim text-ink"
          />
        </div>

        {/* Filtros de categoría */}
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilter(cat.id)}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
                filter === cat.id
                  ? "bg-accent text-white"
                  : "bg-canvas text-ink-dim hover:bg-hover hover:text-ink"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista scrolleable de herramientas */}
      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1.5">
        {filtered.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => onAdd(tool.kind, tool.overrides)}
            className="group flex items-center gap-2.5 rounded-lg border border-line/60 bg-canvas/60 p-2 text-left transition-all hover:border-accent/60 hover:bg-hover hover:shadow-xs cursor-pointer active:scale-[0.98]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-panel text-ink transition-colors group-hover:text-accent">
              {tool.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-ink truncate">{tool.label}</span>
                {tool.badge && (
                  <span className="rounded bg-sky-500/15 px-1 py-0.2 text-[9px] font-bold text-sky-400">
                    {tool.badge}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-ink-dim truncate leading-tight">{tool.desc}</p>
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-xs text-ink-dim">No se encontraron elementos</p>
        )}
      </div>
    </aside>
  );
}
