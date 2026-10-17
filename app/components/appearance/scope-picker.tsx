"use client";

import type { ComponentDef } from "../site/types";

/** Dónde se están definiendo las reglas. La página es siempre la que se está editando. */
export type ScopeChoice =
  | { kind: "global" }
  | { kind: "page" }
  | { kind: "component"; componentId: string };

const COMPONENT_PREFIX = "component:";

const toValue = (choice: ScopeChoice): string =>
  choice.kind === "component" ? `${COMPONENT_PREFIX}${choice.componentId}` : choice.kind;

const fromValue = (value: string): ScopeChoice =>
  value.startsWith(COMPONENT_PREFIX)
    ? { kind: "component", componentId: value.slice(COMPONENT_PREFIX.length) }
    : value === "page"
      ? { kind: "page" }
      : { kind: "global" };

interface ScopePickerProps {
  choice: ScopeChoice;
  pageName: string;
  components: ComponentDef[];
  onChange: (choice: ScopeChoice) => void;
}

export function ScopePicker({ choice, pageName, components, onChange }: ScopePickerProps) {
  return (
    <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
      Aplicar reglas a
      <select
        value={toValue(choice)}
        onChange={(e) => onChange(fromValue(e.target.value))}
        className="h-9 rounded-md border border-line bg-canvas px-2 text-[13px] text-ink outline-none focus:border-accent [&>option]:bg-panel [&>optgroup]:bg-panel"
      >
        <option value="global">Todo el sitio (global)</option>
        <option value="page">Solo esta página: {pageName}</option>
        <optgroup label="Un componente concreto">
          {components.map((component) => (
            <option key={component.id} value={`${COMPONENT_PREFIX}${component.id}`}>
              {component.name}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  );
}
