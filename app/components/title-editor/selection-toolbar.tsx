"use client";

import { useCanvasSettings } from "../canvas-editing/settings-context";
import { useSiteDispatch } from "../site/site-context";
import type { CanvasElement } from "../site/types";
import { INITIAL_STATE } from "./constants";
import { ScopeSwitch } from "./scope-switch";
import { barStateOf, formatActions, type FormatSelection } from "./selection-format";
import { Toolbar } from "./toolbar";

/** La barra de formato cuando hay una sección o elementos seleccionados: el formato va a lo seleccionado. */
export function SelectionToolbar({ selection, elements }: { selection: FormatSelection; elements: CanvasElement[] }) {
  const dispatch = useSiteDispatch();
  const { settings } = useCanvasSettings();

  return (
    <Toolbar
      mode="selection"
      caption={selection.label}
      extra={<ScopeSwitch />}
      state={{ ...INITIAL_STATE, ...barStateOf(elements) }}
      onChange={(patch) => formatActions(settings.scope, selection, patch).forEach(dispatch)}
    />
  );
}
