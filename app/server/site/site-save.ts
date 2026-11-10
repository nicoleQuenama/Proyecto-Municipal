import type { SiteState } from "../../components/site/types.ts";
import { encryptJson } from "../secret-box.ts";
import { replaceOwnStyles, replacesOnlyOwnStyles } from "../units/scoped-styles.ts";
import type { UnitAccess } from "../units/types.ts";
import { saveCode } from "./code-store.ts";
import { decomposePage, draft } from "./decompose-page.ts";
import { decomposeComment, decomposeComponent, decomposeFunction, decomposeLibrary, decomposeRule, decomposeSource, decomposeVariable } from "./decompose-site.ts";
import type { CodeDraft, Owner } from "./rows.ts";
import type { ListPatch, SitePatch, SaveResult } from "./site-patch.ts";
import { applyOrder, deleteAll, deleteIds, deleteStale, upsertRows, type Scope, type Tx } from "./site-sql.ts";
import { ANIMATIONS, BLOCKS, COMMENTS, COMPONENTS, FUNCTIONS, LIBRARIES, MEDIA, PAGES, RULES, SOURCES, STEPS, VARIABLES } from "./site-tables.ts";

const upserts = <T>(list: ListPatch<T> | undefined): T[] => list?.upsert ?? [];
const idsOf = (items: readonly { id: string }[]): string[] => items.map((item) => item.id);

/** Con unidades: el sitio entero tal como estaba y a qué tiene acceso quien guarda (sin ello, todo funciona como siempre). */
export interface ApplyOptions {
  current?: SiteState | null;
  access?: UnitAccess;
}

/** Escribe un parche del editor en la base de datos, dentro de la transacción de quien guarda (con sus permisos). */
export async function applyPatch(tx: Tx, scope: Scope, userId: string, patch: SitePatch, options: ApplyOptions = {}): Promise<SaveResult> {
  const owners: Owner[] = [];
  const code: CodeDraft[] = [];

  // 1. Lo que la persona eliminó a propósito (borrar una página o un componente se lleva sus secciones, por la base de datos).
  await deleteIds(tx, "pages", scope, patch.pages?.remove ?? []);
  await deleteIds(tx, "components", scope, patch.components?.remove ?? []);
  await deleteIds(tx, "shared_functions", scope, patch.functions?.remove ?? []);
  await deleteIds(tx, "data_sources", scope, patch.sources?.remove ?? []);
  await deleteIds(tx, "project_libraries", scope, patch.libraries?.remove ?? []);
  await deleteIds(tx, "design_comments", scope, patch.comments?.remove ?? []);

  // 2. Componentes (antes que las secciones que los usan).
  const components = upserts(patch.components).map((def) => decomposeComponent(def, 0));
  await upsertRows(tx, COMPONENTS, scope, components.map((part) => part.row));
  owners.push(...components.map((part) => ({ kind: "component", id: part.row.id }) as Owner));
  code.push(...components.flatMap((part) => part.code));

  // 3. Páginas con todo lo que cuelga de ellas: viajan completas, así que lo que ya no viene se borra.
  const pages = upserts(patch.pages).map((page) => decomposePage(page, 0));
  const pageIds = pages.map((part) => part.page.id);
  const blocks = pages.flatMap((part) => part.blocks);
  const animations = pages.flatMap((part) => part.animations);
  const steps = pages.flatMap((part) => part.steps);
  await upsertRows(tx, PAGES, scope, pages.map((part) => part.page));
  await upsertRows(tx, BLOCKS, scope, blocks);
  await deleteStale(tx, BLOCKS, scope, { column: "page_id", ids: pageIds }, blocks);
  const media = pages.flatMap((part) => part.media);
  await upsertRows(tx, MEDIA, scope, media);
  await deleteStale(tx, MEDIA, scope, { column: "page_id", ids: pageIds }, media);
  await deleteStale(tx, ANIMATIONS, scope, { column: "page_id", ids: pageIds }, animations);
  await upsertRows(tx, ANIMATIONS, scope, animations);
  await upsertRows(tx, STEPS, scope, steps);
  await deleteStale(tx, STEPS, scope, { column: "animation_id", ids: idsOf(animations) }, steps);
  owners.push(...pageIds.map((id) => ({ kind: "page", id }) as Owner), ...idsOf(blocks).map((id) => ({ kind: "block", id }) as Owner));
  code.push(...pages.flatMap((part) => part.code));

  // 4. Estilos: listas pequeñas que se reemplazan enteras (quien no puede tocar lo global, solo lo suyo).
  if (replacesOnlyOwnStyles(options.access, options.current)) {
    await replaceOwnStyles(tx, scope, options.access, options.current!, patch);
  } else {
    if (patch.variables) {
      await deleteAll(tx, "style_variables", scope);
      await upsertRows(tx, VARIABLES, scope, patch.variables.map(decomposeVariable));
    }
    if (patch.rules) {
      await deleteAll(tx, "style_rules", scope);
      await upsertRows(tx, RULES, scope, patch.rules.map(decomposeRule));
    }
  }

  // 5. Lo que cuelga de secciones y páginas.
  const functions = upserts(patch.functions).map((fn) => decomposeFunction(fn, 0));
  await upsertRows(tx, FUNCTIONS, scope, functions.map((part) => part.row));
  owners.push(...functions.map((part) => ({ kind: "function", id: part.row.id }) as Owner));
  code.push(...functions.flatMap((part) => part.code));

  const sources = upserts(patch.sources).map((source) => decomposeSource(source, 0));
  const storedSources = sources.map(({ row: { headers, ...row } }) => ({ ...row, headersEnc: headers && (headers as unknown[]).length > 0 ? encryptJson(headers).toString("base64") : null }));
  await upsertRows(tx, SOURCES, scope, storedSources);
  owners.push(...sources.map((part) => ({ kind: "source", id: part.row.id }) as Owner));
  code.push(...sources.flatMap((part) => part.code));

  await upsertRows(tx, LIBRARIES, scope, upserts(patch.libraries).map((library) => decomposeLibrary(library, 0)));
  await upsertRows(tx, COMMENTS, scope, upserts(patch.comments).map((comment) => ({ ...decomposeComment(comment, 0), authorId: userId })));

  // 6. El orden de las listas.
  for (const [table, list] of [["pages", patch.pages], ["components", patch.components], ["shared_functions", patch.functions], ["data_sources", patch.sources], ["project_libraries", patch.libraries], ["design_comments", patch.comments]] as const) {
    await applyOrder(tx, table, scope, list?.order ?? []);
  }

  // 7. Lo del proyecto en sí.
  if (patch.navigation !== undefined || patch.settings !== undefined) {
    await tx.unsafe(`update app.projects set navigation = coalesce($3::jsonb, navigation), settings = coalesce($4::jsonb, settings) where organization_id = $1 and id = $2`, [
      scope.org,
      scope.project,
      (patch.navigation ?? null) as never,
      (patch.settings ?? null) as never,
    ]);
  }
  if (patch.globalCss !== undefined) {
    owners.push({ kind: "project" });
    code.push(...draft({ kind: "project" }, "global.css", "css", patch.globalCss));
  }

  // 8. El código, como árboles; lo que tiene errores de sintaxis se rechaza y se conserva lo anterior.
  return { rejectedCode: await saveCode(tx, scope, owners, code) };
}
