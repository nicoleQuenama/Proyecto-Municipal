import type { SiteState } from "../../components/site/types.ts";
import { decomposePage, type PageParts } from "./decompose-page.ts";
import { decomposeComment, decomposeComponent, decomposeFunction, decomposeLibrary, decomposeProject, decomposeRule, decomposeSource, decomposeVariable } from "./decompose-site.ts";
import type { CodeDraft, SiteRows } from "./rows.ts";

const flat = <T>(parts: PageParts[], pick: (part: PageParts) => T[]): T[] => parts.flatMap(pick);

/** Todo el sitio en filas más su código (todavía como texto): lo que el guardado hace entidad por entidad, aquí junto. */
export function decomposeSite(state: SiteState): { rows: SiteRows; code: CodeDraft[] } {
  const pages = state.pages.map((page, index) => decomposePage(page, index));
  const components = state.components.map((def, index) => decomposeComponent(def, index));
  const functions = state.functions.map((fn, index) => decomposeFunction(fn, index));
  const sources = state.sources.map((source, index) => decomposeSource(source, index));
  const project = decomposeProject(state);

  return {
    rows: {
      project: project.row,
      pages: pages.map((part) => part.page),
      blocks: flat(pages, (part) => part.blocks),
      media: flat(pages, (part) => part.media),
      animations: flat(pages, (part) => part.animations),
      steps: flat(pages, (part) => part.steps),
      components: components.map((part) => part.row),
      variables: state.variables.map(decomposeVariable),
      rules: state.rules.map(decomposeRule),
      functions: functions.map((part) => part.row),
      sources: sources.map((part) => part.row),
      libraries: state.libraries.map(decomposeLibrary),
      comments: (state.comments ?? []).map(decomposeComment),
    },
    code: [...project.code, ...pages.flatMap((part) => part.code), ...components.flatMap((part) => part.code), ...functions.flatMap((part) => part.code), ...sources.flatMap((part) => part.code)],
  };
}
