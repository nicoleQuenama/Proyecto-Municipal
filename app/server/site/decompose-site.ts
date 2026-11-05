import type { ComponentDef, SharedFunction, SiteState } from "../../components/site/types.ts";
import type { DataSource } from "../../components/data-sources/types.ts";
import type { DesignComment } from "../../components/comments/comment-rules.ts";
import type { StyleRule, StyleScope, Variable } from "../../components/styles/types.ts";
import { draft, without } from "./decompose-page.ts";
import { MAPPED_KEYS } from "./site-keys.ts";
import type { CodeDraft, CommentRow, ComponentRow, FunctionRow, LibraryRow, Owner, ProjectRow, RuleRow, SourceRow, VariableRow } from "./rows.ts";

const scopeColumns = (scope: StyleScope) => ({
  scope: scope.kind,
  pageId: scope.kind === "page" ? scope.pageId : null,
  componentId: scope.kind === "component" ? scope.componentId : null,
});

export const decomposeVariable = (variable: Variable, position: number): VariableRow => ({
  id: variable.id,
  ...scopeColumns(variable.scope),
  name: variable.name,
  kind: variable.kind,
  value: variable.value,
  position,
});

export const decomposeRule = (rule: StyleRule, position: number): RuleRow => ({ ...scopeColumns(rule.scope), target: rule.target, props: rule.props, position });

export function decomposeComponent(def: ComponentDef, position: number): { row: ComponentRow; code: CodeDraft[] } {
  const { id, name, description, category, width, height, elements, links, drawn, custom, styles, ...settings } = def;
  const owner: Owner = { kind: "component", id };
  const code: CodeDraft[] = [];
  const keptStyles = Object.fromEntries(
    Object.entries(styles ?? {}).map(([key, style]) => {
      code.push(...draft(owner, `styles.${key}.css`, "css", style.css));
      return [key, without(style, "css")];
    }),
  );
  return { row: { id, name, description, category, width, height, elements, links, styles: keptStyles, custom: !!custom, drawn: !!drawn, position, settings }, code };
}

export function decomposeFunction(fn: SharedFunction, position: number): { row: FunctionRow; code: CodeDraft[] } {
  const { scope } = fn;
  return {
    row: {
      id: fn.id,
      name: fn.name,
      scopeKind: scope.kind,
      blockId: scope.kind === "global" ? null : scope.blockId,
      elementId: scope.kind === "element" ? scope.elementId : null,
      position,
    },
    code: draft({ kind: "function", id: fn.id }, "body", "typescript", fn.code),
  };
}

export function decomposeSource(source: DataSource, position: number): { row: SourceRow; code: CodeDraft[] } {
  return {
    row: {
      id: source.id,
      name: source.name,
      url: source.url,
      method: source.method,
      query: source.query,
      headers: source.headers,
      cacheKind: source.cache.kind,
      cacheSeconds: source.cache.seconds,
      position,
    },
    code: draft({ kind: "source", id: source.id }, "transform", "typescript", source.transform),
  };
}

export const decomposeLibrary = (library: SiteState["libraries"][number], position: number): LibraryRow => ({ ...library, position });

export const decomposeComment = (comment: DesignComment, position: number): CommentRow => ({
  id: comment.id,
  pageId: comment.pageId,
  x: comment.x,
  y: comment.y,
  body: comment.text,
  audience: comment.audience,
  resolved: !!comment.resolved,
  createdAt: comment.at,
  position,
});

export function decomposeProject(state: SiteState): { row: ProjectRow; code: CodeDraft[] } {
  return {
    row: { navigation: state.navigation, settings: without(state, ...MAPPED_KEYS) },
    code: draft({ kind: "project" }, "global.css", "css", state.globalCss),
  };
}
