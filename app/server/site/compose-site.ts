import type { ComponentDef, SharedFunction, SiteState } from "../../components/site/types.ts";
import type { DataSource } from "../../components/data-sources/types.ts";
import type { DesignComment } from "../../components/comments/comment-rules.ts";
import type { StyleRule, StyleScope, Variable } from "../../components/styles/types.ts";
import { composePage, textOf } from "./compose-page.ts";
import type { CodeTexts, CommentRow, ComponentRow, FunctionRow, Owner, RuleRow, SiteRows, SourceRow, VariableRow } from "./rows.ts";

type Json = Record<string, unknown>;

/** Cómo se arma un ámbito (global / página / componente) a partir de las columnas que lo guardan. */
const SCOPES: Record<string, (row: { pageId: string | null; componentId: string | null }) => StyleScope> = {
  global: () => ({ kind: "global" }),
  page: (row) => ({ kind: "page", pageId: row.pageId! }),
  component: (row) => ({ kind: "component", componentId: row.componentId! }),
};

const composeVariable = (row: VariableRow): Variable => ({ id: row.id, scope: SCOPES[row.scope](row), name: row.name, kind: row.kind as Variable["kind"], value: row.value });
const composeRule = (row: RuleRow): StyleRule => ({ scope: SCOPES[row.scope](row), target: row.target as StyleRule["target"], props: row.props as StyleRule["props"] });

function composeComponent(row: ComponentRow, texts: CodeTexts): ComponentDef {
  const owner: Owner = { kind: "component", id: row.id };
  const styles = Object.entries(row.styles).map(([key, style]) => [key, { ...(style as Json), css: textOf(texts, owner, `styles.${key}.css`) }]);
  return {
    ...row.settings,
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    width: row.width,
    height: row.height,
    elements: row.elements,
    links: row.links,
    custom: row.custom,
    ...(row.drawn ? { drawn: true } : {}),
    ...(styles.length > 0 ? { styles: Object.fromEntries(styles) } : {}),
  } as unknown as ComponentDef;
}

/** Dónde vale una función: cómo se arma su alcance a partir de las columnas que lo guardan. */
const FUNCTION_SCOPES: Record<string, (row: FunctionRow) => SharedFunction["scope"]> = {
  global: () => ({ kind: "global" }),
  block: (row) => ({ kind: "block", blockId: row.blockId! }),
  element: (row) => ({ kind: "element", blockId: row.blockId!, elementId: row.elementId! }),
};

const composeFunction = (row: FunctionRow, texts: CodeTexts): SharedFunction => ({
  id: row.id,
  name: row.name,
  code: textOf(texts, { kind: "function", id: row.id }, "body"),
  scope: FUNCTION_SCOPES[row.scopeKind](row),
});

const composeSource = (row: SourceRow, texts: CodeTexts): DataSource =>
  ({
    id: row.id,
    name: row.name,
    url: row.url,
    method: row.method,
    query: row.query,
    headers: row.headers,
    transform: textOf(texts, { kind: "source", id: row.id }, "transform"),
    cache: { kind: row.cacheKind, seconds: row.cacheSeconds },
  }) as DataSource;

const composeComment = (row: CommentRow): DesignComment =>
  ({
    id: row.id,
    pageId: row.pageId,
    x: row.x,
    y: row.y,
    text: row.body,
    author: row.author ?? "",
    at: row.createdAt,
    audience: row.audience,
    ...(row.resolved ? { resolved: true } : {}),
  }) as DesignComment;

/** Las filas de cada página (agrupadas por página y en su orden). */
function byPage<T extends { pageId: string }>(rows: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  rows.forEach((row) => groups.set(row.pageId, [...(groups.get(row.pageId) ?? []), row]));
  return groups;
}

/**
 * El sitio tal como lo espera el editor. Lo que es de cada pantalla (qué está seleccionado, en qué página se está)
 * no se guarda: se parte de la página de inicio.
 */
export function composeSite(rows: SiteRows, texts: CodeTexts): SiteState {
  const blocks = byPage(rows.blocks);
  const media = byPage(rows.media);
  const animations = byPage(rows.animations);
  const pages = rows.pages.map((page) =>
    composePage(page, { blocks: blocks.get(page.id) ?? [], media: media.get(page.id) ?? [], animations: animations.get(page.id) ?? [], steps: rows.steps }, texts),
  );

  return {
    ...rows.project.settings,
    navigation: rows.project.navigation,
    pages,
    comments: rows.comments.map(composeComment),
    currentPageId: (pages.find((page) => page.isHome) ?? pages[0])?.id ?? "",
    components: rows.components.map((row) => composeComponent(row, texts)),
    selectedId: "title",
    selectedElementId: null,
    libraries: rows.libraries.map(({ id, name, version, source }) => ({ id, name, version, source })) as SiteState["libraries"],
    globalCss: textOf(texts, { kind: "project" }, "global.css"),
    functions: rows.functions.map((row) => composeFunction(row, texts)),
    sources: rows.sources.map((row) => composeSource(row, texts)),
    variables: rows.variables.map(composeVariable),
    rules: rows.rules.map(composeRule),
  } as unknown as SiteState;
}
