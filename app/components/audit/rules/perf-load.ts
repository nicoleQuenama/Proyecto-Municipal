import { DEFAULT_CACHE } from "../../data-sources/cache-strategies";
import { defineRule } from "../define-rule";
import { addFontDisplay, fontsWithoutDisplay } from "../fonts";
import { heavyLibrary } from "../libraries";
import { pageElements } from "../page-elements";
import { sourcesOfPage } from "../page-sources";
import { pageCodeBytes, pageNodeCount } from "../page-weight";

const MAX_LOAD_ANIMATIONS = 6;
const MAX_NODES = 1500;
const MAX_CODE_KB = 100;
const MAX_LOAD_REQUESTS = 3;

/** Demasiadas animaciones que arrancan a la vez al cargar. */
export const loadAnimations = defineRule({ id: "perf-load-animations", category: "performance", weight: 4, cap: 8 }, (_site, page) => {
  const stepsOf = (id: string) => page.animations?.find((a) => a.id === id)?.steps.filter((s) => s.at < 300).length ?? 0;
  const count = page.blocks
    .flatMap((b) => b.behaviors ?? [])
    .filter((b) => b.trigger === "load")
    .reduce((sum, b) => sum + (b.action.kind === "play" ? stepsOf(b.action.animationId) : 1), 0);

  return count <= MAX_LOAD_ANIMATIONS
    ? []
    : [{
        title: `${count} animaciones arrancan a la vez al cargar la página`,
        why: "Muchas animaciones simultáneas hacen que el teléfono vaya a tirones justo cuando la persona intenta leer.",
        how: "Escalona las animaciones o déjalas para cuando el elemento aparezca al bajar.",
      }];
});

/** Fuentes de datos sin caché o que se piden todas al abrir la página. */
export const dataLoading = defineRule({ id: "perf-data-sources", category: "performance", weight: 4, cap: 12 }, (site, page) => {
  const used = sourcesOfPage(site, page);
  const uncached = used
    .filter((s) => s.cache.kind === "ttl" && s.cache.seconds <= 0)
    .map((s) => ({
      title: `«${s.name}» no guarda copia: se pide de nuevo en cada visita`,
      why: "Cada visita repite la petición a la API: la página tarda más y se gasta la cuota de la API.",
      how: "Elige una estrategia de caché en la pestaña Datos.",
      fixes: [{ label: "Guardar copia 60 s", build: () => [{ type: "source/save" as const, source: { ...s, cache: DEFAULT_CACHE } }] }],
    }));
  const many =
    used.length > MAX_LOAD_REQUESTS
      ? [{
          title: `${used.length} fuentes de datos se piden al cargar la página`,
          why: "Cada petición suma espera antes de ver el contenido.",
          how: "Une datos en menos APIs, o pagina las listas largas.",
        }]
      : [];
  return [...uncached, ...many];
});

/** Librerías externas pesadas. */
export const libraries = defineRule({ id: "perf-libraries", category: "performance", weight: 5, cap: 15 }, (site) =>
  site.libraries.flatMap((lib) => {
    const kb = heavyLibrary(lib.name);
    return kb
      ? [{
          title: `La librería «${lib.name}» pesa unos ${kb} KB`,
          why: "Todo el código de las librerías se descarga y se ejecuta antes de que la página responda.",
          how: "Quítala si no la usas, o cambia a una alternativa más ligera.",
          fixes: [{ label: "Quitar la librería", build: () => [{ type: "library/remove" as const, id: lib.id }] }],
        }]
      : [];
  }),
);

/** CSS y JavaScript propios muy grandes. */
export const codeSize = defineRule({ id: "perf-code-size", category: "performance", weight: 4, cap: 4 }, (site, page) => {
  const kb = Math.round(pageCodeBytes(site, page) / 1024);
  return kb <= MAX_CODE_KB
    ? []
    : [{
        title: `Tu CSS y JavaScript propios suman ${kb} KB`,
        why: "El navegador debe descargar y analizar todo el código antes de mostrar la página.",
        how: "Borra el CSS y los scripts que no uses y evita pegar librerías enteras.",
      }];
});

/** Tipografías sin `font-display`. */
export const fontDisplay = defineRule({ id: "perf-font-display", category: "performance", weight: 3, cap: 6 }, (site, page) => {
  const places = [
    { css: site.globalCss, name: "el CSS global", save: (css: string) => ({ type: "global-css/set" as const, css }) },
    { css: page.css ?? "", name: "el CSS de la página", save: (css: string) => ({ type: "page/code" as const, pageId: page.id, patch: { css } }) },
  ];
  return places
    .filter((p) => fontsWithoutDisplay(p.css) > 0)
    .map((p) => ({
      title: `Tipografías en ${p.name} sin «font-display»`,
      why: "Sin esa indicación, el texto queda invisible hasta que baja la tipografía (un parpadeo en blanco).",
      how: "Añade font-display: swap para mostrar el texto de inmediato con una letra de reserva.",
      fixes: [{ label: "Añadir font-display: swap", build: () => [p.save(addFontDisplay(p.css))] }],
    }));
});

/** Páginas con demasiados elementos del DOM. */
export const domSize = defineRule({ id: "perf-dom-size", category: "performance", weight: 4, cap: 4 }, (site, page, dom) => {
  const nodes = Math.max(pageNodeCount(site, page, pageElements(site, page).length), dom?.nodes[page.id] ?? 0);
  return nodes <= MAX_NODES
    ? []
    : [{
        title: `La página tiene unos ${nodes} elementos (más de ${MAX_NODES})`,
        why: "Cuantos más elementos, más memoria y más tiempo para dibujar la página, sobre todo en móviles baratos.",
        how: "Divide el contenido en varias páginas o pagina las listas largas.",
      }];
});
