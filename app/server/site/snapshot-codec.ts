import type { SiteState } from "../../components/site/types.ts";
import { decryptJson, encryptJson } from "../secret-box.ts";
import { parseCode, printCode, type Language } from "./code-ast.ts";
import { composeSite } from "./compose-site.ts";
import { decomposeSite } from "./decompose-all.ts";
import { codeKey, ownerKey, type CodeTexts, type Owner, type SiteRows, type SourceRow } from "./rows.ts";

/** Una unidad de código de la foto: ya es un árbol (nunca texto), igual que en `code_units`. */
interface SnapshotCode {
  owner: Owner;
  slot: string;
  language: Language;
  ast: Record<string, unknown>;
}

type StoredRows = Omit<SiteRows, "sources"> & { sources: (Omit<SourceRow, "headers"> & { headersEnc: string | null })[] };

/** Lo que se guarda en `site_snapshots.document`: las filas del sitio y su código como árboles. */
export interface SnapshotDocument {
  rows: StoredRows;
  code: SnapshotCode[];
}

export interface EncodedSnapshot {
  document: SnapshotDocument;
  /** Código con errores de sintaxis: una versión no puede guardarse con él (no hay árbol que guardar). */
  rejectedCode: { where: string; error: string }[];
}

/** El sitio como foto. Las cabeceras de las APIs van cifradas, igual que en la base de datos. */
export function encodeSite(site: SiteState): EncodedSnapshot {
  const { rows, code } = decomposeSite(site);
  const parsed: SnapshotCode[] = [];
  const rejectedCode: EncodedSnapshot["rejectedCode"] = [];
  for (const draft of code) {
    const result = parseCode(draft.language, draft.text);
    if (result.ok) parsed.push({ owner: draft.owner, slot: draft.slot, language: draft.language, ast: result.code.ast });
    else rejectedCode.push({ where: `${ownerKey(draft.owner)} ${draft.slot}`, error: result.error });
  }
  const sources = rows.sources.map(({ headers, ...row }) => ({ ...row, headersEnc: headers && (headers as unknown[]).length > 0 ? encryptJson(headers).toString("base64") : null }));
  return { document: { rows: { ...rows, sources }, code: parsed }, rejectedCode };
}

/** La foto de vuelta como sitio del editor. */
export function decodeSite(document: SnapshotDocument): SiteState {
  const texts: CodeTexts = new Map(document.code.map((unit) => [codeKey(unit.owner, unit.slot), printCode(unit.language, unit.ast)]));
  const sources = document.rows.sources.map(({ headersEnc, ...row }) => ({ ...row, headers: headersEnc ? decryptJson(Buffer.from(headersEnc, "base64")) : [] })) as SourceRow[];
  return composeSite({ ...document.rows, sources }, texts);
}
