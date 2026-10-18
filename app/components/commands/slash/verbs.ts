import { colorStep } from "./color-verb";
import { createStep } from "./create-verb";
import { deleteStep } from "./delete-verb";
import { editStep } from "./edit-verb";
import { hideStep } from "./hide-verb";
import { navigateStep } from "./navigate-verb";
import { ruleStep } from "./rule-verb";
import type { SlashContext, Verb } from "./types";

/** Los comandos que se escriben con «/», en el orden en que se sugieren. */
export function createVerbs(ctx: SlashContext): Verb[] {
  return [
    { name: "crear", description: "Páginas, componentes y bloques", start: () => createStep(ctx) },
    { name: "editar", description: "Nombres, titulares, textos y componentes", start: () => editStep(ctx) },
    { name: "eliminar", description: "Páginas, bloques, componentes, medios y variables", start: () => deleteStep(ctx) },
    { name: "ocultar", description: "Mostrar u ocultar páginas, secciones, textos e imágenes", start: () => hideStep(ctx) },
    { name: "color", description: "Variables de color del sitio", start: () => colorStep(ctx) },
    { name: "regla", description: "Reglas de estilo por tipo de elemento", start: () => ruleStep(ctx) },
    { name: "navegar", description: "Ir a una página o sección", start: () => navigateStep(ctx) },
  ];
}
