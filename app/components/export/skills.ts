import { RULES_TEXT, SKILL_DESCRIPTION, SKILL_NAME } from "./rules";

/** Las herramientas donde se puede dejar instalada la skill (las reglas permanentes). */
export type ToolId = "claude-code" | "agents" | "generic";

export interface ToolTarget {
  label: string;
  /** Dónde se guarda el archivo en el proyecto; vacío si no es un archivo. */
  path: string;
  /** Cómo se instala, en una frase. */
  install: string;
  /** El contenido del archivo. */
  content: string;
  /** Cómo se nombra la skill en el prompt corto. */
  mention: string;
}

const BODY = `# Diseños del CMS → código del proyecto\n\nCuando te pasen una especificación de diseño exportada del CMS (con su código HTML/CSS de referencia), reconstrúyela en este proyecto siguiendo estas reglas:\n\n${RULES_TEXT}`;

/** Cada herramienta: su archivo y su formato. Una nueva es una entrada nueva. */
export const TOOLS: Record<ToolId, ToolTarget> = {
  "claude-code": {
    label: "Claude Code",
    path: `.claude/skills/${SKILL_NAME}/SKILL.md`,
    install: "Guarda este archivo en el proyecto (o en ~/.claude/skills para todos tus proyectos). Claude Code la usa sola cuando le pegues un diseño.",
    content: `---\nname: ${SKILL_NAME}\ndescription: ${SKILL_DESCRIPTION}\n---\n\n${BODY}\n`,
    mention: `la skill «${SKILL_NAME}»`,
  },
  agents: {
    label: "Codex y opencode",
    path: "AGENTS.md",
    install: "Guárdalo como AGENTS.md en la raíz del proyecto. Si ya tienes uno, pega esta sección al final. Codex y opencode lo leen solos.",
    content: `## ${SKILL_NAME}\n\n${BODY.replace("# Diseños del CMS → código del proyecto\n\n", "")}\n`,
    mention: "la sección «cms-design» de AGENTS.md",
  },
  generic: {
    label: "Otro modelo",
    path: "",
    install: "Pega este texto al comienzo de la conversación, antes del diseño. No hace falta instalar nada.",
    content: `${BODY}\n`,
    mention: "las reglas que te di al principio",
  },
};

export const TOOL_IDS = Object.keys(TOOLS) as ToolId[];
