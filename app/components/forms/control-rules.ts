/** Asignar o quitar el rol funcional de un elemento y cambiar sus datos. */

import type { SiteState } from "../site/types";
import { newControl, type ControlKind, type ControlSpec } from "./control-types";

export type ControlAction = {
  type: "component/control";
  componentId: string;
  elementId: string;
  /** Un rol nuevo (con sus datos de partida), cambios a los datos, o `null` para quitarlo. */
  control: { kind: ControlKind } | Partial<ControlSpec> | null;
};

export function setControl(state: SiteState, action: Omit<ControlAction, "type">): SiteState {
  const component = state.components.find((c) => c.id === action.componentId);
  const element = component?.elements.find((e) => e.id === action.elementId);
  if (!component || !element) return state;

  const current = element.control;
  const { control } = action;
  const next: ControlSpec | undefined =
    control === null
      ? undefined
      : control.kind && control.kind !== current?.kind
        ? newControl(control.kind)
        : current && { ...current, ...control };

  const elements = component.elements.map((e) => {
    if (e.id !== action.elementId) return e;
    const updated = { ...e, control: next };
    if (!next) delete updated.control;
    return updated;
  });
  return { ...state, components: state.components.map((c) => (c.id === action.componentId ? { ...c, elements } : c)) };
}

type Handlers = { [K in ControlAction["type"]]: (state: SiteState, action: Extract<ControlAction, { type: K }>) => SiteState };

export const CONTROL_HANDLERS: Handlers = {
  "component/control": (state, action) => setControl(state, action),
};
