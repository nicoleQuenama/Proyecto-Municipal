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
  blockId?: string;
  badgeClass: string;
}

export const MUNICIPAL_QUICK_SEARCHES = [
  "Ventanilla Única",
  "Licencias de funcionamiento",
  "Catastro",
  "Impuestos RUAT",
  "Salud municipal",
  "Emergencias 151",
  "Permiso de circulación",
  "Gaceta y decretos",
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
    id: "cat-sitram",
    title: "Ventanilla Única Digital (SITRAM)",
    description: "Ingreso de correspondencia, trámites y seguimiento en línea con número de hoja de ruta municipal.",
    category: "Trámite",
    keywords: ["sitram", "ventanilla", "unica", "tramite", "seguimiento", "hoja de ruta", "correspondencia", "solicitud"],
    preferredSlug: "buscador",
  },
  {
    id: "cat-catastro",
    title: "Catastro y Certificación Territorial GAMC",
    description: "Emisión de certificados catastrales, aprobación de planos de loteamiento y registro de bienes inmuebles.",
    category: "Trámite",
    keywords: ["catastro", "plano", "inmueble", "terreno", "lote", "territorio", "urbanismo", "certificado"],
    preferredSlug: "buscador",
  },
  {
    id: "cat-licencias",
    title: "Licencias de Funcionamiento de Actividades Económicas",
    description: "Apertura y renovación de licencias para actividades comerciales, industriales y de servicios.",
    category: "Trámite",
    keywords: ["licencia", "funcionamiento", "actividad", "economica", "negocio", "comercial", "apertura", "renovacion"],
    preferredSlug: "tramites-y-leyes",
  },
  {
    id: "cat-ruat",
    title: "Pago de Impuestos y Patentes Municipales (RUAT)",
    description: "Liquidación y pago de tributos de vehículos automotores, inmuebles y patentes con descuentos oficiales.",
    category: "Trámite",
    keywords: ["ruat", "impuesto", "patente", "vehiculo", "inmueble", "pago", "tributo", "descuento", "deuda"],
    preferredSlug: "tramites-y-leyes",
  },
  {
    id: "cat-salud",
    title: "Farmacia Municipal y Red de Salud GAMC",
    description: "Atención en centros de salud de 1er y 2do nivel y medicamentos esenciales a precio social en farmacias comunales.",
    category: "Servicio",
    keywords: ["salud", "farmacia", "medicamentos", "remedios", "insumos", "popular", "cesfam", "hospital", "doctor"],
    preferredSlug: "buscador",
  },
  {
    id: "cat-emergencias",
    title: "Líneas de Emergencia SEM 151, Seguridad 1404 y Defensoría",
    description: "Atención médica prehospitalaria, ambulancias SEM 151, patrullaje 1404, Defensoría de la Niñez 156 y Línea 800-14-0200.",
    category: "Contacto",
    keywords: ["seguridad", "1404", "151", "156", "emergencia", "patrullaje", "denuncia", "alarma", "vecinos", "ambulancia", "defensoria"],
    preferredSlug: "buscador",
  },
  {
    id: "cat-gaceta",
    title: "Gaceta Municipal, Decretos Ediles y Leyes",
    description: "Consulta y descarga de leyes municipales, decretos edilicios, reglamentos y resoluciones de Cochabamba.",
    category: "Trámite",
    keywords: ["gaceta", "decreto", "ley", "norma", "reglamento", "resolucion", "ordenanza"],
    preferredSlug: "tramites-y-leyes",
  },
  {
    id: "cat-decreto-84",
    title: "Decreto Ejecutivo 84/2020",
    description: "Se DELEGA y DESIGNA a la máxima autoridad ejecutiva tributaria municipal del GAMC.",
    category: "Información",
    keywords: ["decreto", "84", "2020", "gestion descendente", "tributario", "ingresos", "delegacion", "codigo tributario"],
    preferredSlug: "tramites-y-leyes",
  },
  {
    id: "cat-decreto-83",
    title: "Decreto Ejecutivo 83/2020",
    description: "Se MODIFICA el Decreto Ejecutivo 76/2020 para contrataciones de prevención del COVID-19.",
    category: "Información",
    keywords: ["decreto", "83", "2020", "modificacion", "contratacion", "covid", "coronavirus", "decreto supremo 4174"],
    preferredSlug: "tramites-y-leyes",
  },
  {
    id: "cat-permiso",
    title: "Pago de Permiso de Circulación y RUAT Vehicular",
    description: "Calcula y paga el permiso y radicatoria de vehículos particulares, comerciales y motos en línea.",
    category: "Trámite",
    keywords: ["permiso", "circulación", "vehiculo", "auto", "pago", "patente", "multas", "soap", "ruat", "radicatoria"],
    preferredSlug: "tramites-y-leyes",
  },
  {
    id: "cat-patentes",
    title: "Pago de Patentes Comerciales y Profesionales",
    description: "Renovación semestral de patentes comerciales, industriales y microempresas familiares.",
    category: "Trámite",
    keywords: ["patente", "comercial", "negocio", "empresa", "pago", "tributo"],
    preferredSlug: "tramites-y-leyes",
  },
  {
    id: "cat-licencia",
    title: "Renovación y Primera Licencia de Conducir",
    description: "Agenda de horas para exámenes médicos, psicotécnicos y prácticos de tránsito.",
    category: "Trámite",
    keywords: ["licencia", "conducir", "manejo", "chofer", "tránsito", "examen", "hora"],
    preferredSlug: "tramites-y-leyes",
  },
  {
    id: "cat-subsidios",
    title: "Subsidios Sociales y Becas Comunales",
    description: "Postulación a subsidio de agua potable, becas escolares y financiamiento estudiantil.",
    category: "Servicio",
    keywords: ["subsidio", "beca", "social", "agua", "estudiantes", "ayuda", "vulnerabilidad"],
    preferredSlug: "buscador",
  },
  {
    id: "cat-audiencia",
    title: "Solicitud de Audiencia Vecinal con el Alcalde",
    description: "Agenda una reunión con el Alcalde o los equipos directivos de las direcciones comunales.",
    category: "Contacto",
    keywords: ["alcalde", "audiencia", "reunión", "cita", "vecinal", "atención", "audiencias"],
    preferredSlug: "buscador",
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
  const match = site.pages.find(
    (p) =>
      p.slug === preferredSlug ||
      p.name.toLowerCase() === preferredSlug.toLowerCase() ||
      p.id === preferredSlug,
  );
  if (match) return match.id;
  const buscadorPage = site.pages.find(
    (p) => p.slug === "buscador" || p.name.toLowerCase() === "buscador",
  );
  if (buscadorPage) return buscadorPage.id;
  return site.pages[0]?.id;
}

function categorizeHit(hitLabel: string, detail: string): SearchCategory {
  const text = `${hitLabel} ${detail}`.toLowerCase();
  if (detail === "Página") return "Página";
  if (text.includes("trámite") || text.includes("permiso") || text.includes("patente") || text.includes("licencia") || text.includes("pago") || text.includes("certificado") || text.includes("sitram") || text.includes("ruat") || text.includes("catastro")) {
    return "Trámite";
  }
  if (text.includes("salud") || text.includes("farmacia") || text.includes("subsidio") || text.includes("beca") || text.includes("vecinal") || text.includes("taller")) {
    return "Servicio";
  }
  if (text.includes("contacto") || text.includes("emergencia") || text.includes("1404") || text.includes("151") || text.includes("156") || text.includes("teléfono") || text.includes("correo")) {
    return "Contacto";
  }
  return "Información";
}

/**
 * Busca trámites, servicios, páginas y contenidos en todo el sitio municipal.
 * Da prioridad al contenido real creado dinámicamente en las páginas del sitio.
 */
export function searchMunicipalContent(site: SiteState, query: string): MunicipalSearchHit[] {
  const normalizedQuery = normalizeString(query);
  if (!normalizedQuery) {
    // Si la consulta está vacía, devuelve los trámites y servicios del catálogo municipal
    return MUNICIPAL_CATALOG.map((item) => ({
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

  // 1. Buscar primero en las páginas y bloques reales del sitio (lo dinámico manda y redirige al lugar exacto)
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
        blockId: hit.blockId,
        badgeClass: CATEGORY_STYLES[category],
      });
    }
  }

  // 2. Complementar con el catálogo municipal de trámites y servicios institucionales
  for (const item of MUNICIPAL_CATALOG) {
    const itemHaystack = normalizeString(`${item.title} ${item.description} ${item.keywords.join(" ")}`);
    const matches = queryTerms.every((term) => itemHaystack.includes(term));
    if (matches) {
      const norm = normalizeString(item.title);
      if (!seenTitles.has(norm)) {
        seenTitles.add(norm);
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
  }

  return results.slice(0, 20);
}
