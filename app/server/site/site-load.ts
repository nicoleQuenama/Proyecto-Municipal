import type { SiteState } from "../../components/site/types.ts";
import { decryptJson } from "../secret-box.ts";
import { loadCodeTexts } from "./code-store.ts";
import { composeSite } from "./compose-site.ts";
import type { AnimationRow, BlockRow, CommentRow, ComponentRow, FunctionRow, LibraryRow, MediaRow, PageRow, RuleRow, SiteRows, SourceRow, StepRow, VariableRow } from "./rows.ts";
import { readRows, type Scope, type Tx } from "./site-sql.ts";
import { ANIMATIONS, BLOCKS, COMMENTS, COMPONENTS, FUNCTIONS, LIBRARIES, MEDIA, PAGES, RULES, SOURCES, STEPS, VARIABLES } from "./site-tables.ts";

type StoredSource = Omit<SourceRow, "headers"> & { headersEnc: Buffer | null };
type StoredComment = Omit<CommentRow, "x" | "y" | "createdAt"> & { x: string; y: string; createdAt: Date };

/** Las cabeceras de las APIs se guardan cifradas; aquí vuelven a su forma. */
const readSource = ({ headersEnc, ...row }: StoredSource): SourceRow => ({ ...row, headers: headersEnc ? decryptJson(headersEnc) : [] });

/** Postgres devuelve los `numeric` como texto y las fechas como `Date`. */
const readComment = (row: StoredComment): CommentRow => ({ ...row, x: Number(row.x), y: Number(row.y), createdAt: row.createdAt.toISOString() });

/**
 * El sitio del proyecto tal como lo espera el editor, o `null` si todavía no se guardó nada
 * (entonces el editor parte de su sitio de ejemplo). Las lecturas van en paralelo sobre la misma conexión.
 */
export async function loadSite(tx: Tx, scope: Scope): Promise<SiteState | null> {
  const [project, pages, blocks, media, animations, steps, components, variables, rules, functions, sources, libraries, comments, texts] = await Promise.all([
    tx.unsafe(`select navigation, settings from app.projects where organization_id = $1 and id = $2`, [scope.org, scope.project]) as unknown as Promise<SiteRows["project"][]>,
    readRows<PageRow>(tx, PAGES, scope, "position"),
    readRows<BlockRow>(tx, BLOCKS, scope, "page_id, position"),
    readRows<MediaRow>(tx, MEDIA, scope, "page_id, position"),
    readRows<AnimationRow>(tx, ANIMATIONS, scope, "page_id, position"),
    readRows<StepRow>(tx, STEPS, scope, "animation_id, position"),
    readRows<ComponentRow>(tx, COMPONENTS, scope, "position"),
    readRows<VariableRow>(tx, VARIABLES, scope, "position"),
    readRows<RuleRow>(tx, RULES, scope, "position"),
    readRows<FunctionRow>(tx, FUNCTIONS, scope, "position"),
    readRows<StoredSource>(tx, SOURCES, scope, "position"),
    readRows<LibraryRow>(tx, LIBRARIES, scope, "position"),
    readRows<StoredComment>(tx, COMMENTS, scope, "position"),
    loadCodeTexts(tx, scope),
  ]);
  if (pages.length === 0 && components.length === 0) return null;

  return composeSite(
    { project: project[0], pages, blocks, media, animations, steps, components, variables, rules, functions, sources: sources.map(readSource), libraries, comments: comments.map(readComment) },
    texts,
  );
}
