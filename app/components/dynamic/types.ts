import type { DataRef } from "../data-sources/types";

/** Lo que vale un parámetro de un enlace: un texto escrito o una clave de una API (que cambia en cada copia). */
export type LinkParamValue = string | DataRef;

/** Los parámetros de los enlaces de un bloque: por id de elemento y por nombre de parámetro. */
export type LinkParams = Record<string, Record<string, LinkParamValue>>;
