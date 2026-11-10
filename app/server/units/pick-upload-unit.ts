import { VersionError } from "../versions/branch-rows";
import type { UnitAccess } from "./types";
import { ownsUnit } from "./units-access";

const forbidden = (what: string): never => {
  throw new VersionError(`No puedes ${what}.`, 403);
};

/**
 * La unidad a la que va un archivo que se sube. `requested`: la unidad que pidió el editor (`null` = global) o `undefined` si
 * no pidió ninguna. Quien está en una sola unidad no tiene que elegir; quien está en varias, sí.
 */
export function pickUploadUnit(access: UnitAccess, requested: string | null | undefined): string | null {
  if (!access.scoped) return requested ?? null;
  if (requested === undefined) {
    if (access.unitIds.length === 1) return access.unitIds[0];
    if (access.unitIds.length === 0) return access.canEditGlobal ? null : forbidden("subir archivos sin pertenecer a una unidad");
    throw new VersionError("Elige la unidad a la que va el archivo.", 400);
  }
  if (requested === null) return access.canEditGlobal ? null : forbidden("subir archivos globales");
  return ownsUnit(access, requested) ? requested : forbidden("subir archivos a una unidad que no es tuya");
}
