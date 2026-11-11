"use client";

import { useState } from "react";
import { Badge } from "../ui/badge";
import { PROP_DEFS, TARGET_DEFS } from "../styles/registry";
import { availableVariables, inheritedValue, resolveValue } from "../styles/resolve";
import type {
  StyleContext,
  StyleProp,
  StyleRule,
  StyleScope,
  StyleState,
  StyleTarget,
} from "../styles/types";
import { StyleField } from "./style-field";

interface TargetCardProps {
  target: StyleTarget;
  /** Nombre a mostrar si no es el del catálogo (p. ej. «Caja de este componente»). */
  label?: string;
  rule: StyleRule | undefined;
  scope: StyleScope;
  ctx: StyleContext;
  styles: StyleState;
  onSet: (prop: StyleProp, value: string | null) => void;
  onClear: () => void;
  /** Sin permiso (estilos globales de otro) se lista en solo lectura: se ve, no se toca. */
  canEdit?: boolean;
  restrictColorsToPalette?: boolean;
}

/** Las reglas de un tipo de elemento en el ámbito elegido. */
export function TargetCard({
  target,
  label,
  rule,
  scope,
  ctx,
  styles,
  onSet,
  onClear,
  canEdit = true,
  restrictColorsToPalette = false,
}: TargetCardProps) {
  const [open, setOpen] = useState(false);
  const def = TARGET_DEFS[target];
  const count = Object.keys(rule?.props ?? {}).length;
  const variables = availableVariables(styles.variables, ctx);

  return (
    <li className="rounded-lg border border-line">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-hover cursor-pointer"
      >
        <span aria-hidden className={`text-ink-dim transition-transform ${open ? "" : "-rotate-90"}`}>▾</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium">{label ?? def.label}</span>
          <span className="block truncate text-[11px] text-ink-dim">{def.hint}</span>
        </span>
        {count > 0 && <Badge tone="accent">{count}</Badge>}
      </button>

      {open && (
        <div className="flex flex-col gap-3 border-t border-line p-3">
          {canEdit ? (
            <>
              {def.props.map((prop) => (
                <StyleField
                  key={prop}
                  prop={prop}
                  raw={rule?.props[prop]}
                  inherited={inheritedValue(styles, ctx, target, prop, scope)}
                  variables={variables}
                  resolve={(value) => resolveValue(value, styles.variables, ctx)}
                  onChange={(value) => onSet(prop, value)}
                  restrictToPalette={restrictColorsToPalette}
                />
              ))}

              {count > 0 && (
                <button
                  type="button"
                  onClick={onClear}
                  className="h-7 self-start rounded-md px-2 text-xs text-ink-dim hover:bg-hover hover:text-red-400 cursor-pointer"
                >
                  Quitar todas las reglas de aquí
                </button>
              )}
            </>
          ) : (
            count > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {def.props
                  .filter((prop) => rule?.props[prop] !== undefined)
                  .map((prop) => {
                    const value = resolveValue(rule?.props[prop] ?? "", styles.variables, ctx);
                    return (
                      <li key={prop} className="flex items-center gap-2 text-xs">
                        <span className="w-40 shrink-0 truncate text-ink-dim">{PROP_DEFS[prop].label}</span>
                        <span className="flex min-w-0 flex-1 items-center gap-1.5 text-ink">
                          {PROP_DEFS[prop].kind === "color" && (
                            <span aria-hidden="true" className="size-3 shrink-0 rounded-full border border-line" style={{ background: value }} />
                          )}
                          <span className="truncate">{value}</span>
                        </span>
                      </li>
                    );
                  })}
              </ul>
            ) : (
              <p className="text-xs text-ink-dim">Sin reglas definidas en este ámbito.</p>
            )
          )}
        </div>
      )}
    </li>
  );
}
