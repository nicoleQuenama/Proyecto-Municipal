import { defineRule } from "../define-rule";
import { styleAction, suggestAlt } from "../fix-helpers";
import { pageElements } from "../page-elements";
import { elementLabel } from "../../navigation/links";
import type { Fix } from "../types";

const KIND_WORD = { image: "imagen", video: "video" } as const;

/** Imágenes y videos sin texto alternativo (alt). */
export const imageAlt = defineRule({ id: "a11y-image-alt", category: "accessibility", weight: 8, cap: 24, severity: "error" }, (site, page) => {
  const fromElements = pageElements(site, page)
    .filter((a) => (a.element.kind === "image" || a.element.kind === "video") && a.element.src && a.element.alt === undefined)
    .map((a) => {
      const word = KIND_WORD[a.element.kind as "image" | "video"];
      const fixes: Fix[] = [
        {
          label: "Poner texto alternativo",
          ask: { label: `Describe esta ${word} en una frase`, initial: suggestAlt(a.element.src) },
          build: (text) => [styleAction(page.id, a, { alt: (text ?? "").trim() })],
        },
        { label: "Es decorativa", build: () => [styleAction(page.id, a, { alt: "" })] },
      ];
      return {
        title: `${elementLabel(a.element)} sin texto alternativo`,
        why: "Las personas ciegas oyen este texto en lugar de ver la imagen, y Google lo usa para entenderla. Sin él, la imagen es invisible para ellas.",
        how: "Escribe una frase corta que diga qué se ve. Si solo adorna, márcala como decorativa.",
        target: { blockId: a.block.id, elementId: a.element.id },
        fixes,
      };
    });

  const fromMedia = page.media
    .filter((m) => !m.hidden && m.alt === undefined)
    .map((m) => ({
      title: `Medio «${m.name}» sin texto alternativo`,
      why: "Las personas ciegas oyen este texto en lugar de ver la imagen, y Google lo usa para entenderla.",
      how: "Escribe una frase corta que diga qué se ve, o márcalo como decorativo.",
      target: { mediaId: m.id },
      fixes: [
        {
          label: "Poner texto alternativo",
          ask: { label: "Describe lo que se ve en una frase", initial: suggestAlt(m.src, m.name) },
          build: (text?: string) => [{ type: "media/alt" as const, pageId: page.id, mediaId: m.id, alt: (text ?? "").trim() }],
        },
        { label: "Es decorativo", build: () => [{ type: "media/alt" as const, pageId: page.id, mediaId: m.id, alt: "" }] },
      ],
    }));

  return [...fromElements, ...fromMedia];
});

/** Enlaces sin texto que los describa. */
export const linkName = defineRule({ id: "a11y-link-name", category: "accessibility", weight: 6, cap: 18, severity: "error" }, (site, page) =>
  pageElements(site, page)
    .filter((a) => a.link && !a.bound && !a.element.text.trim() && !a.element.alt?.trim())
    .map((a) => ({
      title: `${elementLabel(a.element)} con enlace pero sin texto`,
      why: "Un lector de pantalla solo dice «enlace» y la persona no sabe a dónde lleva.",
      how: "Descríbelo con una frase corta, como «Ir a Trámites».",
      target: { blockId: a.block.id, elementId: a.element.id },
      fixes: [
        {
          label: "Poner nombre al enlace",
          ask: { label: "¿A dónde lleva este enlace?", initial: "Ir a la página" },
          build: (text?: string) => [styleAction(page.id, a, { alt: (text ?? "").trim() })],
        },
      ],
    })),
);
