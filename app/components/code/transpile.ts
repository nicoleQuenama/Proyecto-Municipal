import { transform } from "sucrase";

/**
 * Convierte TypeScript en JavaScript para ejecutarlo en el navegador. Solo quita los tipos (los errores de
 * tipos los muestra el editor mientras se escribe); los `import`/`export` se conservan como módulos ES.
 */
export function transpileTypeScript(source: string): string {
  return transform(source, { transforms: ["typescript"], disableESTransforms: true }).code;
}

/**
 * Igual, pero si el código tiene un error de sintaxis no lanza: devuelve un script que lo cuenta en la consola,
 * para que un error no rompa la página ni el resto de los bloques.
 */
export function safeTranspile(source: string, label = "TypeScript"): string {
  try {
    return transpileTypeScript(source);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `console.error(${JSON.stringify(`Error de ${label}: ${message}`)});`;
  }
}
