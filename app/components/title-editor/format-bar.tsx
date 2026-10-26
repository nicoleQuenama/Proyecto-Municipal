"use client";

import { SelectionToolbar } from "./selection-toolbar";
import { TitleToolbar } from "./title-editor";
import { useFormatSelection } from "./use-format-selection";

/** La barra de arriba: da formato a lo seleccionado en la página; si no hay nada seleccionado, al titular. */
export function FormatBar() {
  const target = useFormatSelection();
  return target ? <SelectionToolbar selection={target.selection} elements={target.elements} /> : <TitleToolbar />;
}
