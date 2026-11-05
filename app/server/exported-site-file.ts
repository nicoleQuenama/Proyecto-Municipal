/** Dónde va el sitio dentro del paquete exportado: reemplaza al archivo vacío del mismo nombre. */
export const EXPORTED_SITE_PATH = "app/server/exported-site.ts";

/** El archivo con el sitio publicado escrito como código (JSON es JavaScript válido): se compila, no se descarga como dato. */
export const exportedSiteSource = (siteJson: string): string =>
  `/** El sitio publicado de este paquete, escrito por el CMS al exportar. */\nexport const EXPORTED_SITE: unknown = ${siteJson};\n`;
