import { createHash } from "node:crypto";
import { parse as parseTypeScript } from "@babel/parser";
import generateModule from "@babel/generator";
import postcss from "postcss";
import { parseFragment, serialize } from "parse5";

/**
 * El código del usuario nunca se guarda como texto: se parsea a un árbol (Babel para TypeScript, postcss para CSS,
 * parse5 para HTML) y se reimprime al abrirlo. Los imports llevan `.ts` para que también los use `scripts/db-seed.mts`.
 */
export type Language = "typescript" | "css" | "html";
type Parser = "babel" | "postcss" | "parse5";
type Ast = Record<string, unknown>;

export interface ParsedCode {
  parser: Parser;
  parserVersion: string;
  ast: Ast;
  /** Huella del árbol: la base de datos solo se escribe cuando cambia de verdad. */
  sha256: Buffer;
}

export type ParseResult = { ok: true; code: ParsedCode } | { ok: false; error: string };

/** Versiones de los analizadores con que se guardan los árboles (una prueba verifica que coinciden con las instaladas). */
export const PARSER_VERSIONS: Record<Parser, string> = { babel: "7.29.9", postcss: "8.5.31", parse5: "7.3.0" };

interface Codec {
  parser: Parser;
  parse(text: string): Ast;
  print(ast: Ast): string;
}

// El generador de Babel se publica como CommonJS: según quién lo importe, la función llega en `.default`.
const generate = ((generateModule as unknown as { default?: typeof generateModule }).default ?? generateModule) as typeof generateModule;

/** Posiciones y listas de símbolos: ocupan 5-10 veces más que el árbol y se regeneran al imprimir. */
const POSITIONS = new Set(["start", "end", "loc", "range", "tokens", "errors"]);

function withoutPositions(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutPositions);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).filter(([key]) => !POSITIONS.has(key)).map(([key, inner]) => [key, withoutPositions(inner)]));
  }
  return value;
}

const CODECS: Record<Language, Codec> = {
  typescript: {
    parser: "babel",
    parse: (text) =>
      withoutPositions(
        parseTypeScript(text, { sourceType: "module", plugins: ["typescript"], allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true }),
      ) as Ast,
    print: (ast) => generate(ast as never, { comments: true }).code,
  },
  css: {
    parser: "postcss",
    // postcss guarda su espacio en blanco en `raws`: el CSS vuelve idéntico. `source` e `inputs` traen el texto original: fuera.
    parse: (text) => JSON.parse(JSON.stringify(postcss.parse(text).toJSON(), (key, value) => (key === "source" || key === "inputs" ? undefined : value))) as Ast,
    print: (ast) => postcss.fromJSON(ast as never).toString(),
  },
  html: {
    parser: "parse5",
    // parse5 enlaza cada nodo con su padre (un ciclo que JSON no admite); para imprimir no hace falta.
    parse: (text) => JSON.parse(JSON.stringify(parseFragment(text), (key, value) => (key === "parentNode" ? undefined : value))) as Ast,
    print: (ast) => serialize(ast as never),
  },
};

export function parseCode(language: Language, text: string): ParseResult {
  const codec = CODECS[language];
  try {
    const ast = codec.parse(text);
    return { ok: true, code: { parser: codec.parser, parserVersion: PARSER_VERSIONS[codec.parser], ast, sha256: createHash("sha256").update(JSON.stringify(ast)).digest() } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "El código no se pudo leer." };
  }
}

export const printCode = (language: Language, ast: Ast): string => CODECS[language].print(ast);
