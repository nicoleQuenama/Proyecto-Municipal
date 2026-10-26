import { defineRule } from "../define-rule";
import { headingLevels } from "../headings";
import { slugify } from "../../site/rules";
import type { Fix } from "../types";

export const seoTitle = defineRule({ id: "seo-title", category: "seo", weight: 8, cap: 8, severity: "error" }, (_site, page) => {
  const title = page.seo?.title?.trim() ?? "";
  const suggestion = page.isHome ? page.name : `${page.name} · Portal Municipal`;
  const fix: Fix = { label: "Escribir el título", ask: { label: "Título de la pestaña y de Google (hasta 60 letras)", initial: suggestion }, build: (text) => [{ type: "page/seo", pageId: page.id, patch: { title: (text ?? "").trim() } }] };
  if (!title) {
    return [{
      title: "Falta el título para buscadores",
      why: "Es el texto azul que aparece en Google y en la pestaña del navegador. Sin él, Google inventa uno o muestra la dirección.",
      how: "Escribe un título claro de hasta 60 letras que diga de qué trata la página.",
      fixes: [fix],
    }];
  }
  return title.length > 60
    ? [{
        severity: "warning" as const, points: 2,
        title: `El título mide ${title.length} letras (Google corta a los 60)`,
        why: "Un título demasiado largo se corta con «…» en los resultados de búsqueda.",
        how: "Acórtalo a 60 letras o menos.",
        fixes: [{ ...fix, label: "Acortar el título", ask: { ...fix.ask!, initial: title.slice(0, 57).trimEnd() + "…" } }],
      }]
    : [];
});

export const seoDescription = defineRule({ id: "seo-description", category: "seo", weight: 8, cap: 8, severity: "error" }, (_site, page) => {
  const text = page.seo?.description?.trim() ?? "";
  const fix: Fix = {
    label: "Escribir la descripción",
    ask: { label: "Resumen para Google (de 50 a 160 letras)", initial: `Todo sobre ${page.name.toLowerCase()} en el Portal Municipal: información, trámites y contacto.` },
    build: (value) => [{ type: "page/seo", pageId: page.id, patch: { description: (value ?? "").trim() } }],
  };
  if (!text) {
    return [{
      title: "Falta la descripción para buscadores",
      why: "Es la frase gris que aparece bajo el título en Google. Una buena descripción hace que más gente haga clic.",
      how: "Resume la página en una o dos frases (de 50 a 160 letras).",
      fixes: [fix],
    }];
  }
  return text.length < 50 || text.length > 160
    ? [{ severity: "warning" as const, points: 3, title: `La descripción mide ${text.length} letras (lo ideal es 50–160)`,
        why: "Muy corta no dice nada; muy larga Google la corta.", how: "Ajusta su longitud.", fixes: [{ ...fix, label: "Reescribir la descripción", ask: { ...fix.ask!, initial: text } }] }]
    : [];
});

/** Una sola H1 por página. */
export const singleH1 = defineRule({ id: "seo-h1", category: "seo", weight: 6, cap: 6, severity: "error" }, (site, page) => {
  const count = headingLevels(site, page).filter((level) => level === 1).length;
  if (count === 1) return [];
  const fixes: Fix[] = [];
  if (count === 0 && page.title.text.trim()) {
    fixes.push({
      label: "Convertir el titular en H1",
      build: () => [
        { type: "page/select", id: page.id },
        ...(page.titleRemoved ? [{ type: "title/removed" as const, pageId: page.id, removed: false }] : []),
        { type: "title/patch", patch: { block: "h1" } },
      ],
    });
  }
  return [{
    title: count === 0 ? "La página no tiene ningún título principal (H1)" : `La página tiene ${count} títulos principales (H1)`,
    why: "El H1 le dice a Google y a los lectores de pantalla de qué trata la página. Debe haber uno solo.",
    how: count === 0 ? "Marca el titular de la página como «Título 1 (H1)»." : "Deja un solo H1 y baja los demás a H2.",
    fixes,
  }];
});

/** Direcciones legibles. */
export const readableSlug = defineRule({ id: "seo-slug", category: "seo", weight: 3, cap: 3 }, (_site, page) => {
  if (page.isHome || page.route) return [];
  const bad = !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(page.slug) || page.slug.length > 60 || /^\d+$/.test(page.slug);
  if (!bad) return [];
  const clean = slugify(page.name) !== page.slug;
  return [{
    title: `La dirección «/${page.slug}» no es legible`,
    why: "Las direcciones cortas, en minúsculas y con guiones (/tramites) se entienden mejor y posicionan mejor en Google.",
    how: "Cambia el nombre de la página: la dirección se genera sola a partir de él.",
    fixes: clean ? [{ label: "Regenerar desde el nombre", build: () => [{ type: "page/rename", id: page.id, name: page.name }] }] : [],
  }];
});
