import type { Library } from "../site/types";

/** De dónde se carga cada tipo de librería. Una fuente nueva es una entrada nueva. */
const LIBRARY_URLS: Record<Library["source"], (library: Library, origin: string) => string> = {
  // Módulo ES desde un CDN que sirve cada paquete de npm ya listo para el navegador.
  cdn: (library) => `https://esm.sh/${library.name}@${library.version}`,
  // Empaquetado por este proyecto a partir de lo instalado con pnpm (ver app/api/libs/bundle).
  pnpm: (library, origin) => `${origin}/api/libs/bundle?name=${encodeURIComponent(library.name)}`,
};

/** La dirección desde la que se carga una librería como módulo ES. */
export const libraryUrl = (library: Library, origin: string): string => LIBRARY_URLS[library.source](library, origin);

/** El «import map» del navegador: permite escribir `import gsap from "gsap"` en el código del usuario. */
export function importMapOf(libraries: Library[], origin: string): { imports: Record<string, string> } {
  return {
    imports: Object.fromEntries(libraries.map((library) => [library.name, libraryUrl(library, origin)])),
  };
}
