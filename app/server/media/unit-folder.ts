/**
 * La carpeta de ImageKit de un archivo: la de su proyecto y, dentro, la de su unidad (o `global`). La ruta se fija al subir y no
 * cambia aunque el archivo se envíe después a otra unidad (la ficha es inmutable); siempre cuelga de la carpeta de su organización.
 */
export const mediaFolder = (org: string, project: string, unitId: string | null): string => `/org/${org}/${project}/${unitId ?? "global"}`;
