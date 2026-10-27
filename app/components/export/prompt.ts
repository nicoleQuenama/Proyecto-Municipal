import { RULES_TEXT } from "./rules";
import { TOOLS, type ToolId } from "./skills";

interface PromptInput {
  spec: string;
  reference: { html: string; css: string };
  /** Con una herramienta elegida el prompt es corto: las reglas ya están instaladas. Sin ella, van incluidas. */
  installed: ToolId | null;
  /** Archivos de imagen que la persona debe adjuntar o dejar en el proyecto. */
  assets: string[];
}

const fence = (lang: string, code: string) => `\`\`\`${lang}\n${code}\n\`\`\``;

/**
 * El mensaje para pegar en tu modelo: qué hacer, las reglas (si no están instaladas), la especificación y el
 * código de referencia. Es texto armado con reglas fijas; el CMS no habla con ningún modelo.
 */
export function buildPrompt({ spec, reference, installed, assets }: PromptInput): string {
  const task = installed
    ? `Rehace el siguiente diseño en este proyecto, siguiendo ${TOOLS[installed].mention}.`
    : `Rehaz el siguiente diseño en este proyecto con buenas prácticas, siguiendo estas reglas:\n\n${RULES_TEXT}`;
  const files = assets.length ? `\n\n## Imágenes que debes recibir\n\nEstos archivos no van en el texto; adjúntalos o déjalos en el proyecto: ${assets.join(", ")}.` : "";

  return `${task}\n\n---\n\n${spec}${files}\n\n---\n\n## Código de referencia (fiel al diseño, NO para copiar tal cual)\n\nSirve para comparar colores, tamaños y proporciones. Usa posiciones absolutas; reescríbelo con flex/grid.\n\n${fence("html", reference.html)}\n\n${fence("css", reference.css)}\n`;
}
