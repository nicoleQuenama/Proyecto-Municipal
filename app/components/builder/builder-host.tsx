"use client";

import { useCommands } from "../commands/commands-context";
import { ComponentBuilder } from "./component-builder";

/** El constructor de componentes como diálogo de la app: se abre desde el panel o desde un comando. */
export function BuilderHost() {
  const { builder, closeBuilder } = useCommands();
  if (!builder) return null;

  return <ComponentBuilder initial={builder === "new" ? undefined : builder} onClose={closeBuilder} />;
}
