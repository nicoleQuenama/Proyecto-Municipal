import type { ComponentDef } from "./types";

/** Las plantillas hechas desde código por la persona: de sección (un bloque) o de página (su TypeScript y CSS). */
export const myTemplates = (components: ComponentDef[], target: "section" | "page"): ComponentDef[] =>
  components.filter((c) => c.codeKind === "template" && (c.templateFor ?? "section") === target);
