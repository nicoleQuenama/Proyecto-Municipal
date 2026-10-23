import { ALIGN_OPTIONS, BLOCK_OPTIONS, FONT_OPTIONS } from "../title-editor/constants";
import type { TitleState } from "../title-editor/types";
import type { ComponentDef, Page, SiteState } from "../site/types";
import { describeTransition, elementLabel, linkSummary } from "../navigation/links";
import { PROP_DEFS, TARGET_DEFS } from "../styles/registry";
import { scopeKey } from "../styles/resolve";
import type { StyleProp, StyleScope } from "../styles/types";
import type { ExternalState } from "../external-site/types";
import { addExternal, addResponsive, hashOf, type Add } from "./snapshot-extras";
import type { DesignSnapshot, WorkingChange } from "./types";

/** Valor que se muestra cuando una propiedad no existía o ya no existe. */
const ABSENT = "—";

const yesNo = (value: boolean) => (value ? "Sí" : "No");
const LIST_LABELS = { none: "Ninguna", ul: "Viñetas", ol: "Numerada" } as const;

function labelOf(options: { value: string; label: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

const signatureOf = (def: ComponentDef): string =>
  hashOf([def.name, def.category, def.width, def.height, def.elements]);

function addTitle(add: Add, page: Page, title: TitleState) {
  const node = `${page.name} · Titular`;
  const prop = (property: string, value: string) =>
    add(`${page.id}:titular:${property}`, node, property, value);

  prop("Texto", title.text);
  prop("Bloque", labelOf(BLOCK_OPTIONS, title.block));
  prop("Tipografía", labelOf(FONT_OPTIONS, title.font));
  prop("Tamaño", `${title.size}px`);
  prop("Negrita", yesNo(title.bold));
  prop("Cursiva", yesNo(title.italic));
  prop("Subrayado", yesNo(title.underline));
  prop("Tachado", yesNo(title.strike));
  prop("Color", title.color);
  prop("Resaltado", title.highlight ?? "Ninguno");
  prop("Alineación", labelOf(ALIGN_OPTIONS, title.align).replace("Alinear a la ", ""));
  prop("Lista", LIST_LABELS[title.list]);
  prop("Enlace", title.link || "Ninguno");
  prop("Sigue estilos del sitio", yesNo(title.applyToSite));
}

/** Convierte todo el sitio (páginas, bloques, medios y componentes propios) en propiedades comparables. */
export function snapshotDesign({
  pages,
  components,
  variables,
  rules,
  navigation,
  external,
}: Pick<SiteState, "pages" | "components" | "variables" | "rules" | "navigation"> & {
  external?: Pick<ExternalState, "site" | "patches" | "pages" | "autoResponsive">;
}): DesignSnapshot {
  const snapshot: DesignSnapshot = {};
  const add: Add = (key, node, property, value) => {
    snapshot[key] = { node, property, value };
  };

  for (const page of pages) {
    // Crear, renombrar o eliminar una página cambia esta entrada.
    add(`page:${page.id}`, "Página", "Nombre", page.name);
    addTitle(add, page, page.title);
    if (page.hidden) add(`hidden:page:${page.id}`, "Página", `${page.name} · Visibilidad`, "Oculta");
    if (page.titleHidden) add(`hidden:title:${page.id}`, `${page.name} · Titular`, "Visibilidad", "Oculto");

    for (const block of page.blocks) {
      const def = components.find((c) => c.id === block.componentId);
      if (def) add(`block:${block.id}`, `${page.name} · ${def.name}`, "Presencia", "Agregado");
      if (def && block.hidden) add(`hidden:block:${block.id}`, `${page.name} · ${def.name}`, "Visibilidad", "Oculto");
      if (def) addResponsive(add, `${page.name} · ${def.name}`, block);
      if (def && (block.box || block.elements)) {
        add(`format:${block.id}`, `${page.name} · ${def.name}`, "Formato", hashOf([block.box, block.elements]));
      }
    }

    for (const item of page.media) {
      const kind = item.kind === "image" ? "Imagen" : "Video";
      add(`media:${item.id}`, `${page.name} · ${kind} «${item.name}»`, "Presencia", "Agregado");
      if (item.poster) add(`poster:${item.id}`, `${page.name} · ${kind} «${item.name}»`, "Portada", "Definida");
      if (item.hidden) add(`hidden:media:${item.id}`, `${page.name} · ${kind} «${item.name}»`, "Visibilidad", "Oculto");
    }
  }

  for (const def of components.filter((c) => c.custom)) {
    const count = def.elements.length;
    add(
      `component:${def.id}`,
      `Componente «${def.name}»`,
      "Diseño",
      `${count} ${count === 1 ? "elemento" : "elementos"} · ${signatureOf(def)}`,
    );
  }

  // Navegación: la transición por defecto y los enlaces de cada componente.
  add("nav:transition", "Navegación", "Transición por defecto", describeTransition(navigation.defaultTransition));
  for (const def of components) {
    for (const element of def.elements) {
      const link = def.links[element.id];
      if (link) add(`link:${def.id}:${element.id}`, `Enlaces · ${def.name}`, elementLabel(element), linkSummary(link, pages));
    }
  }

  // Variables y reglas de apariencia, con el ámbito en el que están definidas.
  const scopeName = (scope: StyleScope): string => {
    if (scope.kind === "global") return "Todo el sitio";
    if (scope.kind === "page") return pages.find((p) => p.id === scope.pageId)?.name ?? "Página";
    return `Componente «${components.find((c) => c.id === scope.componentId)?.name ?? "?"}»`;
  };

  for (const variable of variables) {
    add(`var:${variable.id}`, `Estilos · ${scopeName(variable.scope)}`, `--${variable.name}`, variable.value);
  }
  for (const rule of rules) {
    for (const [prop, value] of Object.entries(rule.props) as [StyleProp, string][]) {
      add(
        `rule:${scopeKey(rule.scope)}:${rule.target}:${prop}`,
        `Estilos · ${scopeName(rule.scope)}`,
        `${TARGET_DEFS[rule.target].label} · ${PROP_DEFS[prop].label}`,
        value,
      );
    }
  }

  if (external) addExternal(add, external);
  return snapshot;
}

/** Diferencias entre la última versión guardada y el diseño actual (el «git status»). */
export function diffSnapshots(baseline: DesignSnapshot, current: DesignSnapshot): WorkingChange[] {
  const changes: WorkingChange[] = [];

  for (const key of new Set([...Object.keys(baseline), ...Object.keys(current)])) {
    const before = baseline[key];
    const after = current[key];
    if (before?.value === after?.value) continue;

    const { node, property } = (after ?? before)!;
    changes.push({
      key,
      node,
      property,
      before: before?.value ?? ABSENT,
      after: after?.value ?? ABSENT,
      current: after ?? null,
    });
  }

  return changes;
}
