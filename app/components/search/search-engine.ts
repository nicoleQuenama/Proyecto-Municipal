/**
 * Motor de búsqueda inteligente para portales municipales.
 * Indexa páginas del sitio, bloques, tarjetas y el catálogo de trámites y servicios ciudadanos.
 */

import type { SiteState } from "../site/types";
import { searchContent } from "../commands/slash/content-search";

export type SearchCategory = "Trámite" | "Servicio" | "Página" | "Contacto" | "Información";

export interface MunicipalSearchHit {
  id: string;
  title: string;
  description: string;
  category: SearchCategory;
  pageId?: string;
  badgeClass: string;
}

export const MUNICIPAL_QUICK_SEARCHES = [
  "Permiso de circulación",
  "Farmacia comunal",
  "Pago de patentes",
  "Licencia de conducir",
  "Subsidios y becas",
  "Seguridad 1404",
];

interface CatalogItem {
  id: string;
  title: string;
  description: string;
  category: SearchCategory;
  keywords: string[];
  preferredSlug: string;
}

export const MUNICIPAL_CATALOG: CatalogItem[] = [
  {
    id: "cat-permiso",
    title: "Pago de Permiso de Circulación 2026",
    description: "Calcula y paga el permiso de vehículos particulares, comerciales y motos en línea.",
    category: "Trámite",
    keywords: ["permiso", "circulación", "vehiculo", "auto", "pago", "patente", "multas", "soap"],
    preferredSlug: "tramites",
  },
  {
    id: "cat-patentes",
    title: "Pago de Patentes Comerciales y Profesionales",
    description: "Renovación semestral de patentes comerciales, industriales y microempresas familiares.",
    category: "Trámite",
    keywords: ["patente", "comercial", "negocio", "empresa", "pago", "tributo"],
    preferredSlug: "tramites",
  },
  {
    id: "cat-licencia",
    title: "Renovación y Primera Licencia de Conducir",
    description: "Agenda de horas para exámenes médicos, psicotécnicos y prácticos de tránsito.",
    category: "Trámite",
    keywords: ["licencia", "conducir", "manejo", "chofer", "tránsito", "examen", "hora"],
    preferredSlug: "tramites",
  },
  {
    id: "cat-farmacia",
    title: "Farmacia y Salud Popular",
    description: "Medicamentos e insumos a precio de costo para todos los vecinos registrados.",
    category: "Servicio",
    keywords: ["farmacia", "salud", "medicamentos", "remedios", "insumos", "popular", "cesfam"],
    preferredSlug: "servicios",
  },
  {
    id: "cat-subsidios",
    title: "Subsidios Sociales y Becas Comunales",
    description: "Postulación a subsidio de agua potable, becas escolares y financiamiento estudiantil.",
    category: "Servicio",
    keywords: ["subsidio", "beca", "social", "agua", "estudiantes", "ayuda", "vulnerabilidad"],
    preferredSlug: "servicios",
  },
  {
    id: "cat-seguridad",
    title: "Seguridad Vecinal y Emergencias 1404",
    description: "Central telefónica gratuita 24/7 para patrullaje preventivo, reportes y emergencias.",
    category: "Contacto",
    keywords: ["seguridad", "1404", "emergencia", "patrullaje", "denuncia", "alarma", "vecinos"],
    preferredSlug: "contacto",
  },
  {
    id: "cat-audiencia",
    title: "Solicitud de Audiencia Vecinal con el Alcalde",
    description: "Agenda una reunión con el Alcalde o los equipos directivos de las direcciones comunales.",
    category: "Contacto",
    keywords: ["alcalde", "audiencia", "reunión", "cita", "vecinal", "atención", "audiencias"],
    preferredSlug: "contacto",
  },
];

const CATEGORY_STYLES: Record<SearchCategory, string> = {
  Trámite: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  Servicio: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  Página: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  Contacto: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  Información: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function resolvePageId(site: SiteState, preferredSlug: string): string | undefined {
  const match = site.pages.find((p) => p.slug === preferredSlug || p.name.toLowerCase() === preferredSlug);
  return match?.id ?? site.pages[0]?.id;
}

function categorizeHit(hitLabel: string, detail: string): SearchCategory {
  const text = `${hitLabel} ${detail}`.toLowerCase();
  if (detail === "Página") return "Página";
  if (text.includes("trámite") || text.includes("permiso") || text.includes("patente") || text.includes("licencia") || text.includes("pago") || text.includes("certificado")) {
    return "Trámite";
  }
  if (text.includes("salud") || text.includes("farmacia") || text.includes("subsidio") || text.includes("beca") || text.includes("vecinal") || text.includes("taller")) {
    return "Servicio";
  }
  if (text.includes("contacto") || text.includes("emergencia") || text.includes("1404") || text.includes("teléfono") || text.includes("correo")) {
    return "Contacto";
  }
  return "Información";
}

/**
 * Busca trámites, servicios, páginas y contenidos en todo el sitio municipal.
 */
export function searchMunicipalContent(site: SiteState, query: string): MunicipalSearchHit[] {
  const normalizedQuery = normalizeString(query);
  if (!normalizedQuery) {
    // Si la consulta está vacía, devuelve los trámites más destacados del catálogo
    return MUNICIPAL_CATALOG.slice(0, 4).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      pageId: resolvePageId(site, item.preferredSlug),
      badgeClass: CATEGORY_STYLES[item.category],
    }));
  }

  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);
  const results: MunicipalSearchHit[] = [];
  const seenTitles = new Set<string>();

  // 1. Buscar en el catálogo municipal
  for (const item of MUNICIPAL_CATALOG) {
    const itemHaystack = normalizeString(`${item.title} ${item.description} ${item.keywords.join(" ")}`);
    const matches = queryTerms.every((term) => itemHaystack.includes(term));
    if (matches) {
      seenTitles.add(normalizeString(item.title));
      results.push({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        pageId: resolvePageId(site, item.preferredSlug),
        badgeClass: CATEGORY_STYLES[item.category],
      });
    }
  }

  // 2. Buscar en las páginas y bloques reales del sitio
  const dynamicHits = searchContent(site, query);
  for (const hit of dynamicHits) {
    const norm = normalizeString(hit.label);
    if (!seenTitles.has(norm)) {
      seenTitles.add(norm);
      const category = categorizeHit(hit.label, hit.detail);
      results.push({
        id: hit.id,
        title: hit.label,
        description: `Encontrado en: ${hit.detail}`,
        category,
        pageId: hit.pageId,
        badgeClass: CATEGORY_STYLES[category],
      });
    }
  }

  return results.slice(0, 20);
}
