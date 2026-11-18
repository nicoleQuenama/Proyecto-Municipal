import type { CodeSource } from "../site/types";
import type { CodeLanguage } from "./file-ref";

/** En qué archivo del bloque nuevo cae el código seleccionado, según el lenguaje del editor. */
const FRAGMENT_FIELD: Record<CodeLanguage, "html" | "css" | "js"> = {
  html: "html",
  css: "css",
  typescript: "js",
};

/** El código de un bloque nuevo hecho con lo que se seleccionó: solo se llena el archivo de su lenguaje. */
export const fragmentCode = (language: CodeLanguage, text: string): Partial<CodeSource> => ({ [FRAGMENT_FIELD[language]]: text });
