"use client";

import { InlineForm } from "../ui/inline-form";
import { useSaveVersion } from "./use-save-version";
import { plural } from "./versioning-rules";

/** Guardar los cambios como una versión: solo hace falta decir qué se hizo. */
export function SaveVersionForm() {
  const { toSave, save } = useSaveVersion();

  return (
    <InlineForm
      label="Mensaje de la versión"
      placeholder="¿Qué cambiaste? (p. ej. Nuevo titular azul)"
      submitLabel={`Guardar (${plural(toSave.length, "cambio", "cambios")})`}
      onSubmit={save}
    />
  );
}
