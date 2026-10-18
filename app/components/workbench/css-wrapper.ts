/**
 * El CSS de un elemento son declaraciones sueltas («display: flex;»). El servicio de CSS del editor solo sugiere
 * propiedades y valores (flex, grid, px…) dentro de un bloque `{ }`, así que el editor muestra ese CSS dentro de
 * un bloque `& { … }` fijo. Lo que se guarda es solo lo de dentro.
 */

const OPEN = "& {\n";
const CLOSE = "\n}";

/** Lo guardado, tal como se ve en el editor: dentro del bloque `& { … }`. */
export const wrapDeclarations = (inner: string): string => `${OPEN}${inner}${CLOSE}`;

/**
 * Lo que hay dentro del bloque. Tolera que se haya tocado el envoltorio (por ejemplo al seleccionarlo todo y
 * escribir encima): se recupera lo escrito y el bloque se vuelve a poner.
 */
export function unwrapDeclarations(text: string): string {
  return text.replace(/^&\s*\{\n?/, "").replace(/\n?\}\s*$/, "");
}

/** Los números de línea del envoltorio (la primera y la última), para atenuarlos. */
export const wrapperLines = (lineCount: number): number[] => [1, lineCount];
