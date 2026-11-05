/** Los archivos del paquete que se sube: ruta relativa → contenido. */
export type BundleFiles = Record<string, Uint8Array>;

export type DeployOutcome = { ok: true; url?: string; detail: string } | { ok: false; error: string };

type Strings = Record<string, string>;

/** Cómo se prueba y se despliega a un tipo de servidor. Un servidor nuevo es un `Deployer` nuevo en `deployers/index.ts`. */
export interface Deployer {
  /** Comprueba que los datos sirven (se puede entrar y la carpeta existe o se puede crear) sin subir nada. */
  test: (values: Strings, secrets: Strings) => Promise<DeployOutcome>;
  /** Sube el paquete. */
  deploy: (values: Strings, secrets: Strings, files: BundleFiles) => Promise<DeployOutcome>;
}

/** Los errores de red llegan como «fetch failed» o con códigos crípticos: aquí se dicen con palabras. */
export function explain(error: unknown): string {
  const code = (error as { code?: string; cause?: { code?: string } } | null)?.code ?? (error as { cause?: { code?: string } } | null)?.cause?.code;
  const known: Record<string, string> = {
    ENOTFOUND: "No se encontró ese servidor: revisa la dirección.",
    ECONNREFUSED: "El servidor rechazó la conexión: revisa el puerto y que el servicio esté encendido.",
    ETIMEDOUT: "El servidor no respondió a tiempo: revisa la dirección, el puerto y el cortafuegos.",
    ECONNRESET: "El servidor cortó la conexión.",
  };
  if (code && known[code]) return known[code];
  return error instanceof Error ? error.message : "No se pudo completar la operación.";
}

/** Une carpetas remotas sin dobles barras y sin salirse hacia arriba (`..`). */
export function remotePath(...parts: string[]): string {
  const clean = parts.join("/").split("/").filter((part) => part && part !== "." && part !== "..");
  return `/${clean.join("/")}`;
}

/** Las carpetas que hay que crear para subir esos archivos, de las más cercanas a la raíz a las más profundas. */
export function directoriesOf(root: string, files: BundleFiles): string[] {
  // También las carpetas de la ruta de destino (`public_html/sitio` pide `public_html` y luego `sitio`): crear una que ya existe no cuesta.
  const dirs = new Set<string>();
  const base = remotePath(root).split("/").filter(Boolean);
  base.forEach((_, index) => dirs.add(`/${base.slice(0, index + 1).join("/")}`));
  for (const path of Object.keys(files)) {
    const parts = path.split("/").slice(0, -1);
    parts.forEach((_, index) => dirs.add(remotePath(root, ...parts.slice(0, index + 1))));
  }
  return [...dirs].sort((a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b));
}
