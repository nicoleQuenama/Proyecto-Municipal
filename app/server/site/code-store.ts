import { parseCode, printCode, type Language, type ParsedCode } from "./code-ast.ts";
import { codeKey, ownerKey, type CodeDraft, type CodeTexts, type Owner } from "./rows.ts";
import type { Scope, Tx } from "./site-sql.ts";

/** La columna de `code_units` que dice a qué cosa pertenece el código (el proyecto no tiene: todas vacías). */
const OWNER_COLUMNS: Record<Exclude<Owner["kind"], "project">, string> = {
  page: "page_id",
  block: "block_id",
  component: "component_id",
  function: "shared_function_id",
  source: "data_source_id",
};
const COLUMN_LIST = Object.values(OWNER_COLUMNS);
const ownerOfRow = (row: Record<string, string | null>): Owner => {
  const entry = Object.entries(OWNER_COLUMNS).find(([, column]) => row[column] !== null);
  return entry ? ({ kind: entry[0], id: row[entry[1]]! } as Owner) : { kind: "project" };
};

interface StoredUnit {
  id: string;
  slot: string;
  sha256: Buffer;
  owner: Owner;
}

export interface RejectedCode {
  where: string;
  error: string;
}

/** Los trozos de código que ya están guardados de esos dueños (el proyecto cuenta como uno más, si va en la lista). */
async function storedUnits(tx: Tx, scope: Scope, owners: readonly Owner[]): Promise<StoredUnit[]> {
  const conditions: string[] = [];
  const params: unknown[] = [scope.org, scope.project];
  for (const [kind, column] of Object.entries(OWNER_COLUMNS)) {
    const ids = owners.flatMap((owner) => (owner.kind === kind ? [(owner as { id: string }).id] : []));
    if (ids.length === 0) continue;
    params.push(ids);
    conditions.push(`${column} = any($${params.length}::text[])`);
  }
  if (owners.some((owner) => owner.kind === "project")) conditions.push(`(${COLUMN_LIST.map((column) => `${column} is null`).join(" and ")})`);
  if (conditions.length === 0) return [];

  const rows = (await tx.unsafe(
    `select id, slot, ast_sha256 as sha256, ${COLUMN_LIST.join(", ")} from app.code_units where organization_id = $1 and project_id = $2 and (${conditions.join(" or ")})`,
    params as never[],
  )) as unknown as ({ id: string; slot: string; sha256: Buffer } & Record<string, string | null>)[];
  return rows.map((row) => ({ id: row.id, slot: row.slot, sha256: row.sha256, owner: ownerOfRow(row) }));
}

const unitRow = (draft: CodeDraft, code: ParsedCode) => ({
  ...Object.fromEntries(COLUMN_LIST.map((column) => [column, null])),
  ...(draft.owner.kind === "project" ? {} : { [OWNER_COLUMNS[draft.owner.kind]]: draft.owner.id }),
  slot: draft.slot,
  language: draft.language,
  parser: code.parser,
  parserVersion: code.parserVersion,
  ast: code.ast,
  sha256: code.sha256.toString("base64"),
});

/**
 * Guarda el código de esos dueños como árboles. Solo se escribe lo que cambió (por la huella del árbol); lo que ya no
 * está se borra; y el código con errores de sintaxis NO se guarda ni borra nada: se conserva la última versión válida.
 */
export async function saveCode(tx: Tx, scope: Scope, owners: readonly Owner[], drafts: readonly CodeDraft[]): Promise<RejectedCode[]> {
  const rejected: RejectedCode[] = [];
  const wanted = new Map<string, { draft: CodeDraft; code: ParsedCode }>();
  const failed = new Set<string>();
  for (const draft of drafts) {
    const key = codeKey(draft.owner, draft.slot);
    const parsed = parseCode(draft.language, draft.text);
    if (parsed.ok) wanted.set(key, { draft, code: parsed.code });
    else {
      failed.add(key);
      rejected.push({ where: `${ownerKey(draft.owner)} ${draft.slot}`, error: parsed.error });
    }
  }

  const stored = new Map((await storedUnits(tx, scope, owners)).map((unit) => [codeKey(unit.owner, unit.slot), unit]));
  const creates = [...wanted].filter(([key]) => !stored.has(key)).map(([, { draft, code }]) => unitRow(draft, code));
  const updates = [...wanted].flatMap(([key, { draft, code }]) => (stored.has(key) && !stored.get(key)!.sha256.equals(code.sha256) ? [{ id: stored.get(key)!.id, ...unitRow(draft, code) }] : []));
  const removes = [...stored].filter(([key]) => !wanted.has(key) && !failed.has(key)).map(([, unit]) => unit.id);

  if (removes.length > 0) await tx.unsafe(`delete from app.code_units where organization_id = $1 and project_id = $2 and id = any($3::uuid[])`, [scope.org, scope.project, removes]);
  if (updates.length > 0) {
    await tx.unsafe(
      `update app.code_units u set language = r.language, parser = r.parser, parser_version = r."parserVersion", ast = r.ast, ast_sha256 = decode(r.sha256, 'base64')
       from jsonb_to_recordset($3::jsonb) as r(id uuid, language text, parser text, "parserVersion" text, ast jsonb, sha256 text)
       where u.organization_id = $1 and u.project_id = $2 and u.id = r.id`,
      [scope.org, scope.project, updates as never],
    );
  }
  if (creates.length > 0) {
    await tx.unsafe(
      `insert into app.code_units (organization_id, project_id, ${COLUMN_LIST.join(", ")}, slot, language, parser, parser_version, ast, ast_sha256)
       select $1::uuid, $2::uuid, ${COLUMN_LIST.map((column) => `r.${column}`).join(", ")}, r.slot, r.language, r.parser, r."parserVersion", r.ast, decode(r.sha256, 'base64')
       from jsonb_to_recordset($3::jsonb) as r(${COLUMN_LIST.map((column) => `${column} text`).join(", ")}, slot text, language text, parser text, "parserVersion" text, ast jsonb, sha256 text)`,
      [scope.org, scope.project, creates as never],
    );
  }
  return rejected;
}

/** Todo el código del proyecto, ya reimpreso desde sus árboles. */
export async function loadCodeTexts(tx: Tx, scope: Scope): Promise<CodeTexts> {
  const rows = (await tx.unsafe(`select ${COLUMN_LIST.join(", ")}, slot, language, ast from app.code_units where organization_id = $1 and project_id = $2`, [scope.org, scope.project])) as unknown as ({
    slot: string;
    language: Language;
    ast: Record<string, unknown>;
  } & Record<string, string | null>)[];
  return new Map(rows.map((row) => [codeKey(ownerOfRow(row), row.slot), printCode(row.language, row.ast)]));
}
