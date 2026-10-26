"use client";

import type { ReactNode } from "react";
import { hasPermission, useAuth } from "../auth/auth-context";
import { ACTIONS, type Field } from "../behaviors/actions";
import { TRIGGERS } from "../behaviors/triggers";
import type { ActionKind, Behavior, BehaviorAction, CodeMode, TriggerKind } from "../behaviors/types";
import type { CanvasElement, Page } from "../site/types";
import { FIELD_RENDERERS, type FieldContext } from "./behavior-fields";

const selectClass =
  "h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent [&>option]:bg-panel";

interface BehaviorEditorProps {
  behavior: Behavior;
  pages: Page[];
  elements: CanvasElement[];
  onChange: (behavior: Behavior) => void;
  onRemove: () => void;
  /** Abre el código de esta interacción en el editor. */
  onOpenCode: () => void;
}

/** Una interacción: cuándo se dispara, qué hace y los datos de esa acción. */
export function BehaviorEditor({ behavior, pages, elements, onChange, onRemove, onOpenCode }: BehaviorEditorProps) {
  const { action } = behavior;
  const definition = ACTIONS[action.kind];
  const { currentUser } = useAuth();
  const canEditCode = hasPermission(currentUser?.role, "editCode");
  const kinds = (Object.keys(ACTIONS) as ActionKind[]).filter((kind) => kind !== "code" || canEditCode);

  const setField = (key: string, value: unknown) =>
    onChange({ ...behavior, action: { ...action, [key]: value } as BehaviorAction });

  const draw = (field: Field) => {
    if (field.type === "code" && !canEditCode) return null;
    const render = FIELD_RENDERERS[field.type] as (field: Field, context: FieldContext) => ReactNode;
    const mode = (action as { mode?: CodeMode }).mode ?? "page";

    return (
      <div key={field.key}>
        {render(field, {
          value: (action as Record<string, unknown>)[field.key],
          onChange: (value) => setField(field.key, value),
          pages,
          elements,
          openCode: onOpenCode,
          mode,
          setMode: (next) => setField("mode", next),
        })}
      </div>
    );
  };

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-line p-2.5">
      <div className="flex items-center gap-1.5">
        <select
          aria-label="Cuándo"
          value={behavior.trigger}
          onChange={(e) => onChange({ ...behavior, trigger: e.target.value as TriggerKind })}
          className={selectClass}
        >
          {(Object.keys(TRIGGERS) as TriggerKind[]).map((trigger) => (
            <option key={trigger} value={trigger}>{TRIGGERS[trigger].label}</option>
          ))}
        </select>
        <button
          type="button"
          aria-label="Quitar interacción"
          title="Quitar interacción"
          onClick={onRemove}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-red-400"
        >
          ×
        </button>
      </div>

      {kinds.includes(action.kind) ? (
        <select
          aria-label="Qué hace"
          value={action.kind}
          onChange={(e) => onChange({ ...behavior, action: ACTIONS[e.target.value as ActionKind].create(pages) })}
          className={selectClass}
        >
          {kinds.map((kind) => (
            <option key={kind} value={kind}>{ACTIONS[kind].label}</option>
          ))}
        </select>
      ) : (
        <p className="text-[11px] text-ink-dim">Esta interacción ejecuta código y tu rol no puede editarla.</p>
      )}

      {definition.fields.map(draw)}
    </li>
  );
}
