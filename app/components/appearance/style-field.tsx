"use client";

import { PROP_DEFS } from "../styles/registry";
import { asVariableRef, variableNameOf } from "../styles/resolve";
import type { StyleProp, Variable } from "../styles/types";
import { PaletteSelect } from "../section-colors/palette-select";
import { LiteralInput } from "./literal-input";

const selectClass =
  "h-8 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent [&>option]:bg-panel";

interface StyleFieldProps {
  prop: StyleProp;
  /** Lo que dice la regla de este ámbito: un valor directo, `var(--x)` o nada. */
  raw: string | undefined;
  /** Lo que se heredaría de ámbitos más generales, ya resuelto. */
  inherited: string | undefined;
  /** Variables que se pueden usar aquí. */
  variables: Variable[];
  resolve: (value: string) => string | undefined;
  onChange: (value: string | null) => void;
  /** Fuera del ámbito global, los roles sin permiso solo eligen colores de la paleta. */
  restrictToPalette?: boolean;
}

/** Una propiedad de una regla: valor directo o variable, con el valor heredado como pista. */
export function StyleField({ prop, raw, inherited, variables, resolve, onChange, restrictToPalette = false }: StyleFieldProps) {
  const { label, kind } = PROP_DEFS[prop];
  const boundName = raw ? variableNameOf(raw) : null;
  const bindable = kind === "color" || kind === "size" || kind === "font";
  const candidates = bindable ? variables.filter((variable) => variable.kind === kind) : [];
  const resolved = raw ? resolve(raw) : undefined;
  const paletteOnly = restrictToPalette && kind === "color" && !boundName;
  const fontsOnly = restrictToPalette && kind === "font" && !boundName;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[11px] text-ink-dim">
        <span>{label}</span>
        {raw !== undefined && (
          <button
            type="button"
            aria-label={`Quitar ${label} (volver a heredar)`}
            title="Quitar: vuelve a heredar"
            onClick={() => onChange(null)}
            className="flex h-5 w-5 items-center justify-center rounded hover:bg-hover hover:text-ink cursor-pointer"
          >
            ×
          </button>
        )}
      </div>

      <div className="flex gap-1.5">
        <div className="min-w-0 flex-1">
          {boundName ? (
            <select
              aria-label={`Variable de ${label}`}
              value={boundName}
              onChange={(e) =>
                onChange(e.target.value === "" ? (resolved ?? null) : asVariableRef(e.target.value))
              }
              className={`${selectClass} w-full`}
            >
              <option value="">Valor directo</option>
              {candidates.map((variable) => (
                <option key={variable.id} value={variable.name}>--{variable.name}</option>
              ))}
              {!candidates.some((variable) => variable.name === boundName) && (
                <option value={boundName}>--{boundName} (no definida)</option>
              )}
            </select>
          ) : paletteOnly ? (
            <PaletteSelect
              options={candidates.map((variable) => ({ name: variable.name, value: variable.value }))}
              value={resolved ?? ""}
              onChange={(color) => {
                const match = candidates.find((variable) => variable.value === color);
                if (match) onChange(asVariableRef(match.name));
              }}
            />
          ) : fontsOnly ? (
            <select aria-label={`Tipografía de la marca para ${label}`} value="" onChange={(e) => e.target.value && onChange(asVariableRef(e.target.value))} className={`${selectClass} w-full`}>
              <option value="">{resolved ?? "Elige una tipografía de la marca"}</option>
              {candidates.map((variable) => (
                <option key={variable.id} value={variable.name}>--{variable.name}</option>
              ))}
            </select>
          ) : (
            <LiteralInput
              kind={kind}
              label={label}
              value={raw}
              placeholder={inherited}
              unsetLabel="Heredado"
              gradient={prop === "background" || prop === "fill"}
              onCommit={onChange}
            />
          )}
        </div>

        {!boundName && !paletteOnly && !fontsOnly && candidates.length > 0 && (
          <select
            aria-label={`Usar una variable en ${label}`}
            value=""
            onChange={(e) => e.target.value && onChange(asVariableRef(e.target.value))}
            className={`${selectClass} w-24`}
          >
            <option value="">Variable</option>
            {candidates.map((variable) => (
              <option key={variable.id} value={variable.name}>--{variable.name}</option>
            ))}
          </select>
        )}
      </div>

      {raw === undefined && inherited !== undefined && (
        <p className="text-[11px] text-ink-dim">Heredado: {inherited}</p>
      )}
      {boundName && (
        <p className="text-[11px] text-ink-dim">
          {resolved !== undefined ? `Vale ${resolved}` : "Esta variable no está definida aquí"}
        </p>
      )}
    </div>
  );
}
