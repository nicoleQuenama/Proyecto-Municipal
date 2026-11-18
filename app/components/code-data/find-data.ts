import * as ts from "typescript";
import type { CellValue, DataCell, DataRow, DataSet } from "./types";

/** Métodos de arreglo con los que el código recorre una lista. */
const ITERATORS: ReadonlySet<string> = new Set(["forEach", "map", "flatMap", "filter", "some", "every", "reduce", "find"]);

/** Cómo se lee cada literal simple; lo que no está aquí es un valor calculado. */
const LITERALS: { [K in ts.SyntaxKind]?: (node: ts.Node) => CellValue } = {
  [ts.SyntaxKind.StringLiteral]: (n) => (n as ts.StringLiteral).text,
  [ts.SyntaxKind.NoSubstitutionTemplateLiteral]: (n) => (n as ts.NoSubstitutionTemplateLiteral).text,
  [ts.SyntaxKind.NumericLiteral]: (n) => Number((n as ts.NumericLiteral).text),
  [ts.SyntaxKind.TrueKeyword]: () => true,
  [ts.SyntaxKind.FalseKeyword]: () => false,
};

const valueOf = (node: ts.Node): CellValue | null => LITERALS[node.kind]?.(node) ?? null;

const keyOf = (name: ts.PropertyName): string | null =>
  ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name) ? name.text : null;

function readRow(obj: ts.ObjectLiteralExpression, file: ts.SourceFile): DataRow {
  const cells: DataCell[] = [];
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const key = keyOf(prop.name);
    if (key === null) continue;
    cells.push({ key, value: valueOf(prop.initializer), start: prop.initializer.getStart(file), end: prop.initializer.end });
  }
  return { start: obj.getStart(file), end: obj.end, cells };
}

/** ¿El código recorre la lista (`x.forEach`, `for…of x`, `x[i]`)? Un objeto suelto cuenta si se usa en cualquier parte. */
function isUsed(name: string, declaration: ts.Node, file: ts.SourceFile, list: boolean): boolean {
  let used = false;
  const visit = (node: ts.Node) => {
    if (used || node === declaration) return;
    if (ts.isIdentifier(node) && node.text === name) {
      const parent = node.parent;
      const iterates =
        (ts.isPropertyAccessExpression(parent) && parent.expression === node && ITERATORS.has(parent.name.text)) ||
        (ts.isForOfStatement(parent) && parent.expression === node) ||
        (ts.isElementAccessExpression(parent) && parent.expression === node);
      used = list ? iterates : true;
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return used;
}

const isRowList = (array: ts.ArrayLiteralExpression) =>
  array.elements.length > 0 && array.elements.every(ts.isObjectLiteralExpression);

/** Los datos del código que el lienzo puede editar: listas de objetos que se recorren y objetos sueltos que se usan. */
export function findData(source: string): DataSet[] {
  const file = ts.createSourceFile("bloque.ts", source, ts.ScriptTarget.Latest, true);
  const sets: DataSet[] = [];

  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const decl of statement.declarationList.declarations) {
      const init = decl.initializer;
      if (!init || !ts.isIdentifier(decl.name)) continue;
      const name = decl.name.text;

      if (ts.isArrayLiteralExpression(init) && isRowList(init)) {
        if (!isUsed(name, decl, file, true)) continue;
        const rows = init.elements.map((e) => readRow(e as ts.ObjectLiteralExpression, file));
        sets.push({ name, kind: "list", rows, start: init.getStart(file), end: init.end });
      } else if (ts.isObjectLiteralExpression(init)) {
        if (!isUsed(name, decl, file, false)) continue;
        sets.push({ name, kind: "object", rows: [readRow(init, file)], start: init.getStart(file), end: init.end });
      }
    }
  }
  return sets;
}
