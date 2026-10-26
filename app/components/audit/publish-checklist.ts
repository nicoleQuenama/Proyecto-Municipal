import type { Category } from "./types";

/**
 * Lo que debe cumplir el HTML publicado para acercarse a un 100 en Lighthouse.
 * Es la lista que usará el publicador real; mientras tanto sirve de guía y de prueba (`verify`).
 */
export interface Requirement {
  id: string;
  category: Category;
  /** Qué debe tener el HTML. */
  requirement: string;
  /** Cómo cumplirlo. */
  how: string;
  /** Comprobación sobre el HTML ya publicado. */
  verify: (html: string) => boolean;
}

const tags = (html: string, name: string): string[] => html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) ?? [];
const head = (html: string) => /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(html)?.[1] ?? "";
const belowFold = (html: string) => tags(html, "img").slice(1);

export const PUBLISH_CHECKLIST: Requirement[] = [
  { id: "doctype", category: "best-practices", requirement: "Empieza con <!doctype html>", how: "Sin él el navegador entra en modo antiguo.", verify: (h) => /^\s*<!doctype html>/i.test(h) },
  { id: "charset", category: "best-practices", requirement: "<meta charset=\"utf-8\"> en el <head>", how: "Evita letras rotas.", verify: (h) => /<meta[^>]+charset=["']?utf-8/i.test(head(h)) },
  { id: "viewport", category: "accessibility", requirement: "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">", how: "Sin él, el móvil dibuja la página como de escritorio y la encoge.", verify: (h) => /<meta[^>]+name=["']viewport["'][^>]+width=device-width/i.test(head(h)) },
  { id: "lang", category: "accessibility", requirement: "<html lang=\"es\"> con el idioma de la página", how: "Usa el idioma elegido en Páginas > Buscadores.", verify: (h) => /<html\b[^>]*\blang=["'][a-z]{2}/i.test(h) },
  { id: "title", category: "seo", requirement: "Un <title> no vacío de hasta 60 letras", how: "Sale de Página > Buscadores > Título.", verify: (h) => /<title>\s*\S[^<]{0,59}<\/title>/i.test(head(h)) },
  { id: "description", category: "seo", requirement: "<meta name=\"description\"> de 50 a 160 letras", how: "Sale de Página > Buscadores > Descripción.", verify: (h) => /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{50,160}["']/i.test(head(h)) },
  { id: "canonical", category: "seo", requirement: "<link rel=\"canonical\" href=\"…\"> con la dirección final", how: "Evita contenido duplicado.", verify: (h) => /<link[^>]+rel=["']canonical["']/i.test(head(h)) },
  { id: "single-h1", category: "seo", requirement: "Exactamente un <h1> y títulos sin saltar niveles", how: "El titular de la página es el H1.", verify: (h) => tags(h, "h1").length === 1 },
  { id: "img-alt", category: "accessibility", requirement: "Toda <img> tiene el atributo alt (vacío si es decorativa)", how: "Sale del texto alternativo de cada imagen.", verify: (h) => tags(h, "img").every((t) => /\balt=/i.test(t)) },
  { id: "img-size", category: "performance", requirement: "Toda <img> con width y height, y srcset en WebP o AVIF", how: "Reserva el espacio (sin saltos) y descarga lo justo.", verify: (h) => tags(h, "img").every((t) => /\bwidth=/i.test(t) && /\bheight=/i.test(t)) },
  { id: "lazy", category: "performance", requirement: "Las imágenes bajo el pliegue llevan loading=\"lazy\" y decoding=\"async\"", how: "La primera imagen (la más grande) lleva fetchpriority=\"high\".", verify: (h) => belowFold(h).every((t) => /loading=["']lazy/i.test(t)) },
  { id: "preconnect", category: "performance", requirement: "<link rel=\"preconnect\"> a los dominios externos (APIs, imágenes, tipografías)", how: "Ahorra el tiempo de abrir la conexión.", verify: (h) => tags(head(h), "link").some((t) => /rel=["']preconnect/i.test(t)) || !/\bsrc=["']https?:\/\//i.test(h) },
  { id: "no-blocking-css", category: "performance", requirement: "Sin CSS que bloquee el dibujo: CSS crítico en <style> y el resto con media=\"print\" onload o preload", how: "El navegador pinta antes de bajar hojas de estilo grandes.", verify: (h) => tags(head(h), "link").filter((t) => /rel=["']stylesheet/i.test(t)).every((t) => /media=|preload/i.test(t)) },
  { id: "font-display", category: "performance", requirement: "Cada @font-face con font-display: swap", how: "El texto se ve de inmediato.", verify: (h) => (h.match(/@font-face\s*\{[^}]*\}/gi) ?? []).every((f) => /font-display/i.test(f)) },
  { id: "noopener", category: "best-practices", requirement: "Los enlaces con target=\"_blank\" llevan rel=\"noopener noreferrer\"", how: "El publicador debe añadirlo siempre.", verify: (h) => tags(h, "a").filter((t) => /target=["']?_blank/i.test(t)).every((t) => /noopener/i.test(t)) },
  { id: "https", category: "best-practices", requirement: "Ningún recurso por http:// (todo https://)", how: "Evita contenido mixto.", verify: (h) => !/(?:src|href)=["']http:\/\//i.test(h) },
];

/** Resultado de comprobar un HTML publicado contra la lista. */
export const verifyPublishedHtml = (html: string): { id: string; ok: boolean }[] =>
  PUBLISH_CHECKLIST.map((r) => ({ id: r.id, ok: r.verify(html) }));

/** La lista como texto, para copiar y pegar (en el publicador o en una tarea). */
export const checklistText = (): string =>
  ["Comprobaciones del HTML publicado (objetivo: Lighthouse 100)", ...PUBLISH_CHECKLIST.map((r, i) => `${i + 1}. ${r.requirement} — ${r.how}`)].join("\n");
