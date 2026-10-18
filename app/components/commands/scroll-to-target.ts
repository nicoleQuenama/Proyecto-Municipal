/** Lleva al centro del lienzo un bloque o, si no se indica, el marco de una página. */
export function scrollToTarget(pageId: string, blockId?: string) {
  const selector = blockId ? `[data-block-id="${CSS.escape(blockId)}"]` : `[data-page-id="${CSS.escape(pageId)}"]`;
  document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
}
