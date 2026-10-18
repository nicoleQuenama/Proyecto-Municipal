/**
 * TypeScript en el editor: opciones del compilador, los tipos de `api` y de `element`, y los tipos
 * del proyecto (las funciones reutilizables y las librerías instaladas) para que se vean al escribir.
 */

import type { Monaco } from "@monaco-editor/react";
import { declarationOf } from "../functions/declaration";
import type { Library, SharedFunction } from "../site/types";

/** Lo que el código de una interacción o de una página recibe. */
const PORTAL_TYPES = `
interface PortalApi {
  /** Va a otra página, por su ruta (servicios) o su nombre. */
  navigate(page: string): void;
  /** Anima el elemento que disparó la interacción. */
  animate(effect: "fade" | "slide-up" | "slide-left" | "zoom" | "bounce" | "shake" | "pulse" | "spin", seconds?: number): void;
  /** Muestra la sección, o un elemento de ella por su id. */
  show(target?: string): void;
  /** Oculta la sección, o un elemento de ella por su id. */
  hide(target?: string): void;
  /** Alterna entre mostrar y ocultar. */
  toggle(target?: string): void;
  /** Abre un enlace en una pestaña nueva. */
  openUrl(url: string): void;
  /** Escribe en la consola. */
  log(...values: unknown[]): void;
  /** La sección a la que pertenece este código (en una página, la propia página). Solo en modo «En la página». */
  readonly section: HTMLElement | null;
  /** Busca dentro de la sección. Para apuntar a un elemento: api.query('[data-el="id"]'). Solo en modo «En la página». */
  query<T extends HTMLElement = HTMLElement>(selector: string): T | null;
  /** Igual que query, pero devuelve todos los que coinciden. */
  queryAll<T extends HTMLElement = HTMLElement>(selector: string): T[];
}

/** Lo que el sitio ofrece al código de una interacción o de una página. */
declare const api: PortalApi;
/** El elemento (o la sección) que disparó la interacción: es el destino del código, ya elegido por el editor. */
declare const element: HTMLElement;
`;

/** 2749: «es un valor, pero se usa como tipo». 2709: «no se puede usar un espacio de nombres como tipo». */
export const IGNORED_DIAGNOSTICS = [2749, 2709];

let monacoInstance: Monaco | null = null;

/** Configura TypeScript y CSS una sola vez, antes de crear el primer editor. */
export function configureTypescript(monaco: Monaco) {
  if (monacoInstance) return;
  monacoInstance = monaco;

  const { typescriptDefaults, ScriptTarget, ModuleKind, ModuleResolutionKind } = monaco.languages.typescript;
  typescriptDefaults.setCompilerOptions({
    target: ScriptTarget.ES2022,
    module: ModuleKind.ESNext,
    moduleResolution: ModuleResolutionKind.NodeJs,
    // Monaco recibe las opciones sin procesar: `lib` lleva nombres de archivo (con «esnext» a secas no cargaba el DOM
    // y `HTMLElement`, `document`… daban «Cannot find name»). «full» = JavaScript moderno + DOM.
    lib: ["lib.esnext.full.d.ts"],
    strict: true,
    // Menos ruido para quien no escribe tipos: los parámetros sin tipo valen como `any`.
    noImplicitAny: false,
    allowNonTsExtensions: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    noEmit: true,
    // Cada archivo es un módulo: dos archivos pueden usar los mismos nombres sin pisarse.
    moduleDetection: 3,
  } as never);
  // Las librerías se declaran sin tipos (`any`): importar de ellas un tipo (`import { Dayjs } from "dayjs"`) no es un error.
  typescriptDefaults.setDiagnosticsOptions({ diagnosticCodesToIgnore: IGNORED_DIAGNOSTICS });
  typescriptDefaults.addExtraLib(PORTAL_TYPES, "file:///portal/api.d.ts");

  // El CSS de un elemento son declaraciones sueltas («color: red;»), sin selector: Monaco marcaría cada una como
  // error («{ expected»). El editor ya avisa de lo que importa (llaves sin pareja, @import) con su propia revisión.
  monaco.languages.css.cssDefaults.setOptions({ validate: false });
}

/**
 * Los tipos del proyecto para el archivo abierto: sus funciones reutilizables como `declare function` y
 * cada librería como módulo (`any`: así `import gsap from "gsap"` no marca error).
 */
export function setProjectTypes(functions: SharedFunction[], libraries: Library[]) {
  const lines = [
    ...functions.map(declarationOf),
    ...libraries.map((library) => `declare module "${library.name}";`),
  ];
  monacoInstance?.languages.typescript.typescriptDefaults.addExtraLib(lines.join("\n"), "file:///portal/project.d.ts");
}
