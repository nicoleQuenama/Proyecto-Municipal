"use client";

import { useState } from "react";
import { hasPermission, useAuth } from "../auth/auth-context";
import { EXAMPLE_COMPONENTS } from "../site/component-templates";
import { isPageNameTaken } from "../site/rules";
import { useCurrentPage, useSite, useSiteDispatch } from "../site/site-context";

interface SectionTemplateItem {
  id: string;
  name: string;
  description: string;
  category: string;
  tag: string;
  badgeColor?: string;
}

const SECTION_TEMPLATES: SectionTemplateItem[] = [
  {
    id: "container-row",
    name: "Contenedor Horizontal (3 Cards)",
    description: "Contenedor auto-layout en fila donde las 3 tarjetas se acomodan dentro automáticamente.",
    category: "cards",
    tag: "Auto-Layout Horizontal",
    badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/30",
  },
  {
    id: "grid-cards",
    name: "Catálogo de Tarjetas (4 PC / 2 Móvil)",
    description: "4 tarjetas responsivas con auto-layout, iconos de servicio y adaptación fluida a pantallas.",
    category: "cards",
    tag: "4 Columnas · Móvil 2",
    badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  },
  {
    id: "bento-grid",
    name: "Cuadrícula Bento Dinámica",
    description: "Layout Bento moderno con celdas de varios tamaños para destacar trámites clave y proyectos.",
    category: "cards",
    tag: "Bento Layout",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  },
  {
    id: "hero-banner",
    name: "Banner Principal (Hero CTA)",
    description: "Titular principal de gran formato, descripción breve y botón de conversión directa.",
    category: "hero",
    tag: "Hero Principal",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  },
  {
    id: "stats-metrics",
    name: "Métricas & Estadísticas",
    description: "4 indicadores numéricos de alto impacto (vecinos atendidos, trámites online, tiempos de respuesta).",
    category: "sections",
    tag: "4 KPIs Clave",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  {
    id: "carousel",
    name: "Carrusel de Novedades",
    description: "Bloque destacado con estilo slider, flechas de avance y contenido visual de proyectos.",
    category: "sections",
    tag: "Slider Visual",
    badgeColor: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  },
  {
    id: "reviews",
    name: "Testimonios Ciudadanos",
    description: "Reseña destacada con 5 estrellas doradas y valoración ciudadana sobre la atención.",
    category: "cards",
    tag: "5 Estrellas",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  {
    id: "navbar",
    name: "Barra de Navegación (Header)",
    description: "Menú superior institucional full-width con enlaces configurados y botón de atención.",
    category: "navigation",
    tag: "Header Superior",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  {
    id: "content-section",
    name: "Sección Informativa",
    description: "Encabezado informativo, párrafo explicativo y botón de acción secundaria.",
    category: "sections",
    tag: "Informativo",
    badgeColor: "bg-slate-500/10 text-slate-300 border-slate-500/30",
  },
  {
    id: "card-service",
    name: "Tarjeta de Servicio Individual",
    description: "Card individual con icono destacado, titular y detalle para catálogo municipal.",
    category: "cards",
    tag: "Ficha",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  },
  {
    id: "cta-buttons",
    name: "Set de Botones CTA",
    description: "Par de botones organizados horizontalmente: acción principal destacada y secundaria.",
    category: "buttons",
    tag: "Acciones",
    badgeColor: "bg-pink-500/10 text-pink-400 border-pink-500/30",
  },
  {
    id: "footer",
    name: "Pie de Página (Footer)",
    description: "Cierre institucional con enlaces a transparencia activa, términos legales y derechos.",
    category: "navigation",
    tag: "Footer",
    badgeColor: "bg-zinc-500/10 text-zinc-300 border-zinc-500/30",
  },
];

interface PageTemplateItem {
  id: string;
  name: string;
  badge: string;
  description: string;
  sections: { id: string; name: string }[];
}

const PAGE_TEMPLATES: PageTemplateItem[] = [
  {
    id: "portal",
    name: "Portal Municipal",
    badge: "Inicio Completo",
    description:
      "Portal vecinal de alto impacto con barra de navegación, hero banner, métricas de gestión, catálogo responsivo de 4 columnas, bento grid de servicios, testimonios y pie de página.",
    sections: [
      { id: "navbar", name: "Barra de navegación" },
      { id: "hero-banner", name: "Banner Principal" },
      { id: "stats-metrics", name: "Métricas de Gestión" },
      { id: "grid-cards", name: "Catálogo de Trámites" },
      { id: "bento-grid", name: "Bento de Servicios" },
      { id: "reviews", name: "Testimonios" },
      { id: "footer", name: "Pie de página" },
    ],
  },
  {
    id: "about",
    name: "Quiénes Somos",
    badge: "Institucional",
    description:
      "Página informativa para presentar la misión de la alcaldía, pilares de gestión, servicios destacados y canales de atención.",
    sections: [
      { id: "navbar", name: "Barra de navegación" },
      { id: "content-section", name: "Misión institucional" },
      { id: "stats-metrics", name: "Cifras comunales" },
      { id: "bento-grid", name: "Pilares del municipio" },
      { id: "cta-buttons", name: "Botones de contacto" },
      { id: "footer", name: "Pie de página" },
    ],
  },
  {
    id: "services",
    name: "Trámites y Servicios",
    badge: "Atención Vecinal",
    description:
      "Estructura orientada a trámites ciudadanos, catálogo organizado de servicios en línea y accesos directos de pago.",
    sections: [
      { id: "navbar", name: "Barra de navegación" },
      { id: "hero-banner", name: "Banner de Trámites" },
      { id: "grid-cards", name: "Catálogo de Trámites" },
      { id: "card-service", name: "Trámite Destacado" },
      { id: "cta-buttons", name: "Canales de Ayuda" },
      { id: "footer", name: "Pie de página" },
    ],
  },
  {
    id: "contact",
    name: "Contacto y Atención",
    badge: "Atención al Vecino",
    description:
      "Canales de comunicación oficiales, horarios de atención, reseñas de satisfacción vecinal y enlaces de contacto.",
    sections: [
      { id: "navbar", name: "Barra de navegación" },
      { id: "hero-banner", name: "Canales de atención" },
      { id: "container-row", name: "Puntos de Atención" },
      { id: "reviews", name: "Opiniones vecinales" },
      { id: "cta-buttons", name: "Formularios y WhatsApp" },
      { id: "footer", name: "Pie de página" },
    ],
  },
];

function getUniquePageName(pages: { id: string; name: string }[], baseName: string): string {
  if (!isPageNameTaken(pages as any, baseName)) return baseName;
  let counter = 2;
  while (isPageNameTaken(pages as any, `${baseName} ${counter}`)) {
    counter++;
  }
  return `${baseName} ${counter}`;
}

export function TemplatesTab() {
  const [tabType, setTabType] = useState<"sections" | "pages">("sections");
  const [query, setQuery] = useState("");
  const [addedSectionId, setAddedSectionId] = useState<string | null>(null);
  const [createdPageId, setCreatedPageId] = useState<string | null>(null);

  const site = useSite();
  const page = useCurrentPage();
  const dispatch = useSiteDispatch();
  const { currentUser } = useAuth();
  const canEditContent = hasPermission(currentUser, "editContent");

  const normalized = query.trim().toLowerCase();

  const filteredSections = SECTION_TEMPLATES.filter(
    (item) =>
      !normalized ||
      item.name.toLowerCase().includes(normalized) ||
      item.description.toLowerCase().includes(normalized) ||
      item.tag.toLowerCase().includes(normalized),
  );

  const filteredPages = PAGE_TEMPLATES.filter(
    (item) =>
      !normalized ||
      item.name.toLowerCase().includes(normalized) ||
      item.description.toLowerCase().includes(normalized) ||
      item.badge.toLowerCase().includes(normalized),
  );

  const handleAddSection = (sectionId: string) => {
    if (!canEditContent) return;
    const comp =
      site.components.find((c) => c.id === sectionId) ??
      EXAMPLE_COMPONENTS.find((ex) => ex.id === sectionId);
    if (!comp) return;

    // Si no está registrado en el sitio, se restaura/guarda primero
    if (!site.components.some((c) => c.id === sectionId)) {
      dispatch({ type: "component/save", component: comp });
    }

    const blockId = crypto.randomUUID();
    dispatch({ type: "block/add", id: blockId, componentId: sectionId, pageId: page.id });
    setAddedSectionId(sectionId);
    setTimeout(() => setAddedSectionId(null), 1800);
  };

  const handleCreatePage = (tmpl: PageTemplateItem) => {
    if (!canEditContent) return;
    const pageName = getUniquePageName(site.pages, tmpl.name);
    const newPageId = crypto.randomUUID();

    // Asegurar que todos los componentes requeridos existan en el estado
    for (const sec of tmpl.sections) {
      if (!site.components.some((c) => c.id === sec.id)) {
        const example = EXAMPLE_COMPONENTS.find((ex) => ex.id === sec.id);
        if (example) {
          dispatch({ type: "component/save", component: example });
        }
      }
    }

    // Crear página
    dispatch({ type: "page/create", id: newPageId, name: pageName });

    // Agregar sus bloques en orden
    for (const sec of tmpl.sections) {
      dispatch({ type: "block/add", id: crypto.randomUUID(), componentId: sec.id, pageId: newPageId });
    }

    // Seleccionar y enfocar la nueva página creada
    dispatch({ type: "page/select", id: newPageId });
    setCreatedPageId(tmpl.id);
    setTimeout(() => setCreatedPageId(null), 2500);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Selector de sub-tipo */}
      <div className="flex rounded-lg bg-canvas p-1">
        <button
          type="button"
          onClick={() => setTabType("sections")}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
            tabType === "sections" ? "bg-accent text-white shadow-sm" : "text-ink-dim hover:text-ink"
          }`}
        >
          Secciones ({SECTION_TEMPLATES.length})
        </button>
        <button
          type="button"
          onClick={() => setTabType("pages")}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
            tabType === "pages" ? "bg-accent text-white shadow-sm" : "text-ink-dim hover:text-ink"
          }`}
        >
          Páginas ({PAGE_TEMPLATES.length})
        </button>
      </div>

      {/* Buscador */}
      <div className="flex h-9 items-center gap-2 rounded-md bg-canvas px-3 focus-within:ring-1 focus-within:ring-accent">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-dim">
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5L14 14" />
        </svg>
        <input
          type="search"
          aria-label="Buscar plantillas"
          placeholder={tabType === "sections" ? "Buscar secciones prehechas…" : "Buscar páginas completas…"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-dim"
        />
      </div>

      {/* VISTA DE SECCIONES */}
      {tabType === "sections" && (
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold tracking-wider text-ink-dim uppercase">
            Bloques listos para insertar en {page.name}
          </p>

          <div className="flex flex-col gap-2.5">
            {filteredSections.map((sec) => {
              const isAdded = addedSectionId === sec.id;
              return (
                <div
                  key={sec.id}
                  className="group relative flex flex-col gap-2 rounded-xl border border-line bg-canvas/40 p-3 transition-colors hover:border-accent/40 hover:bg-hover/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-medium text-ink">{sec.name}</h4>
                    </div>
                    <span className="text-[10px] text-ink-dim font-medium">
                      {sec.tag}
                    </span>
                  </div>

                  <p className="text-xs text-ink-dim leading-relaxed">{sec.description}</p>

                  <div className="mt-1 flex items-center justify-between pt-1">
                    <span className="text-[11px] text-ink-dim">Plantilla de sección</span>
                    <button
                      type="button"
                      disabled={!canEditContent}
                      onClick={() => handleAddSection(sec.id)}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                        isAdded
                          ? "bg-emerald-600 text-white"
                          : "bg-accent text-white hover:bg-accent/90 active:scale-95 disabled:opacity-50"
                      }`}
                    >
                      {isAdded ? "Agregado" : "+ Agregar a la página"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA DE PÁGINAS COMPLETAS */}
      {tabType === "pages" && (
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold tracking-wider text-ink-dim uppercase">
            Páginas pre-armadas listas para usar
          </p>

          <div className="flex flex-col gap-3">
            {filteredPages.map((tmpl) => {
              const isCreated = createdPageId === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  className="group relative flex flex-col gap-2.5 rounded-xl border border-line bg-canvas/40 p-3.5 transition-colors hover:border-accent/40 hover:bg-hover/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-[14px] font-semibold text-ink">{tmpl.name}</h4>
                      <span className="text-[11px] text-ink-dim font-medium">{tmpl.sections.length} secciones incluidas</span>
                    </div>
                  </div>

                  <p className="text-xs text-ink-dim leading-relaxed">{tmpl.description}</p>

                  {/* Pills de secciones que incluye */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {tmpl.sections.map((s, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-hover/80 px-1.5 py-0.5 text-[10px] text-ink-dim"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>

                  <div className="mt-1 flex items-center justify-end border-t border-line/60 pt-2">
                    <button
                      type="button"
                      disabled={!canEditContent}
                      onClick={() => handleCreatePage(tmpl)}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
                        isCreated
                          ? "bg-emerald-600 text-white"
                          : "bg-accent text-white hover:bg-accent/90 active:scale-95 disabled:opacity-50"
                      }`}
                    >
                      {isCreated ? "Página creada" : "+ Crear esta página"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
