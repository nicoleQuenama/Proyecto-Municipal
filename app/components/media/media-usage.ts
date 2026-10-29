import type { Page, ProjectMediaAsset, SiteState } from "../site/types";

export interface MediaUsageLocation {
  pageId: string;
  pageName: string;
  blockId?: string;
  blockName?: string;
  elementId?: string;
  elementLabel?: string;
  type: "page-backdrop" | "block-backdrop" | "element-image" | "page-media";
}

/**
 * Normaliza una etiqueta o texto para comparaciones flexibles (minúsculas y sin acentos).
 */
export function normalizeTag(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Divide un texto en palabras clave normalizadas (mínimo 2 caracteres).
 */
export function extractKeywords(text: string): string[] {
  const norm = normalizeTag(text);
  return norm
    .split(/[\s,._\-#/]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2);
}

/**
 * Determina si una búsqueda coincide con el nombre, la etiqueta principal o las etiquetas secundarias de un medio.
 */
export function matchMediaAsset(query: string, asset: ProjectMediaAsset): boolean {
  if (!query.trim()) return true;

  const queryWords = extractKeywords(query);
  if (queryWords.length === 0) return true;

  const nameWords = extractKeywords(asset.name || "");
  const tagWords = extractKeywords(asset.tag || "");
  const extraTagsWords = (asset.tags || []).flatMap((t) => extractKeywords(t));

  const allAssetWords = new Set([...nameWords, ...tagWords, ...extraTagsWords]);

  // Si alguna palabra clave de la búsqueda coincide parcialmente con alguna palabra del recurso
  return queryWords.some((qw) =>
    Array.from(allAssetWords).some((aw) => aw.includes(qw) || qw.includes(aw)),
  );
}

/**
 * Escanea todo el proyecto para encontrar en qué páginas, bloques y elementos está en uso una imagen o video.
 */
export function findMediaUsage(site: SiteState, src: string): MediaUsageLocation[] {
  const usages: MediaUsageLocation[] = [];
  if (!src) return usages;

  const cleanSrc = src.trim();

  for (const page of site.pages) {
    // 1. Fondo de la página (backdrop)
    if (page.backdrop?.src && page.backdrop.src.trim() === cleanSrc) {
      usages.push({
        pageId: page.id,
        pageName: page.name,
        type: "page-backdrop",
      });
    }

    // 2. Elementos multimedia sueltos en la página
    if (page.media) {
      for (const item of page.media) {
        if (item.src && item.src.trim() === cleanSrc) {
          usages.push({
            pageId: page.id,
            pageName: page.name,
            elementId: item.id,
            elementLabel: item.name || "Elemento multimedia",
            type: "page-media",
          });
        }
      }
    }

    // 3. Bloques y secciones de la página
    if (page.blocks) {
      for (const block of page.blocks) {
        const def = site.components?.find((c) => c.id === block.componentId);
        const blockName = def?.name ?? block.id;

        // Fondo del bloque
        if (block.box?.backdrop?.src && block.box.backdrop.src.trim() === cleanSrc) {
          usages.push({
            pageId: page.id,
            pageName: page.name,
            blockId: block.id,
            blockName,
            type: "block-backdrop",
          });
        }

        // Sobrescrituras de elementos en este bloque
        if (block.elements) {
          for (const [elId, override] of Object.entries(block.elements)) {
            if (override.src && override.src.trim() === cleanSrc) {
              const el = def?.elements.find((e) => e.id === elId);
              usages.push({
                pageId: page.id,
                pageName: page.name,
                blockId: block.id,
                blockName,
                elementId: elId,
                elementLabel: el?.text || el?.alt || el?.id || elId,
                type: "element-image",
              });
            }
          }
        }

        // Valores por defecto del componente base si no fueron sobrescritos
        if (def?.elements) {
          for (const el of def.elements) {
            const hasOwnSrc = block.elements?.[el.id]?.src;
            if (el.src && el.src.trim() === cleanSrc && !hasOwnSrc) {
              const alreadyFound = usages.some(
                (u) => u.pageId === page.id && u.blockId === block.id && u.elementId === el.id,
              );
              if (!alreadyFound) {
                usages.push({
                  pageId: page.id,
                  pageName: page.name,
                  blockId: block.id,
                  blockName,
                  elementId: el.id,
                  elementLabel: el.text || el.alt || el.id,
                  type: "element-image",
                });
              }
            }
          }
        }
      }
    }
  }

  return usages;
}

/**
 * Reemplaza una imagen antigua por una nueva en todas las páginas, fondos y bloques del sitio.
 * Garantiza que ninguna sección quede en blanco o con enlaces rotos tras una sustitución o borrado.
 */
export function replaceMediaInSite(
  site: SiteState,
  oldSrc: string,
  newSrc: string,
  newAlt?: string,
): SiteState {
  if (!oldSrc || !newSrc || oldSrc === newSrc) return site;

  const target = oldSrc.trim();

  const updatedPages: Page[] = site.pages.map((page) => {
    let pageChanged = false;

    // 1. Reemplazar fondo de página
    let backdrop = page.backdrop;
    if (backdrop?.src && backdrop.src.trim() === target) {
      backdrop = { ...backdrop, src: newSrc };
      pageChanged = true;
    }

    // 2. Reemplazar medios de página
    const media = (page.media || []).map((m) => {
      if (m.src && m.src.trim() === target) {
        pageChanged = true;
        return { ...m, src: newSrc, ...(newAlt ? { alt: newAlt, name: newAlt } : {}) };
      }
      return m;
    });

    // 3. Reemplazar en bloques
    const blocks = (page.blocks || []).map((block) => {
      let blockChanged = false;

      // Fondo de bloque
      let box = block.box;
      if (box?.backdrop?.src && box.backdrop.src.trim() === target) {
        box = { ...box, backdrop: { ...box.backdrop, src: newSrc } };
        blockChanged = true;
      }

      // Elementos del bloque
      const elements = { ...(block.elements ?? {}) };
      const def = site.components?.find((c) => c.id === block.componentId);

      // Revisa elementos existentes en override
      for (const [elId, ov] of Object.entries(elements)) {
        if (ov.src && ov.src.trim() === target) {
          elements[elId] = { ...ov, src: newSrc, ...(newAlt ? { alt: newAlt } : {}) };
          blockChanged = true;
        }
      }

      // Revisa si el componente base usaba target y aún no estaba en override
      if (def?.elements) {
        for (const el of def.elements) {
          if (el.src && el.src.trim() === target && !elements[el.id]?.src) {
            elements[el.id] = { ...(elements[el.id] ?? {}), src: newSrc, ...(newAlt ? { alt: newAlt } : {}) };
            blockChanged = true;
          }
        }
      }

      if (blockChanged) {
        pageChanged = true;
        return { ...block, box, elements };
      }
      return block;
    });

    if (pageChanged) {
      return { ...page, backdrop, media, blocks };
    }
    return page;
  });

  return {
    ...site,
    pages: updatedPages,
  };
}
