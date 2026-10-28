"use client";

import { Collapsible } from "../ui/collapsible";
import { useSiteDispatch } from "../site/site-context";
import type { CanvasElement } from "../site/types";
import { CONTROL_LABELS, INPUT_TYPE_LABELS, type ControlKind, type ControlSpec, type InputType } from "./control-types";

const fieldClass = "h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent [&>option]:bg-panel";

const Labeled = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
    {label}
    {children}
  </label>
);

/** El rol del elemento: botón, campo de texto, lista, casilla… y los datos de ese rol. */
export function ControlControls({ componentId, element }: { componentId: string; element: CanvasElement }) {
  const dispatch = useSiteDispatch();
  const spec = element.control;
  const send = (control: { kind: ControlKind } | Partial<ControlSpec> | null) =>
    dispatch({ type: "component/control", componentId, elementId: element.id, control });
  const field = spec && spec.kind !== "button" && spec.kind !== "submit";

  return (
    <Collapsible title="Rol del elemento">
      <Labeled label="¿Qué es?">
        <select
          aria-label="Rol del elemento"
          value={spec?.kind ?? ""}
          onChange={(e) => send(e.target.value ? { kind: e.target.value as ControlKind } : null)}
          className={fieldClass}
        >
          <option value="">Solo se ve (sin rol)</option>
          {(Object.keys(CONTROL_LABELS) as ControlKind[]).map((kind) => (
            <option key={kind} value={kind}>{CONTROL_LABELS[kind]}</option>
          ))}
        </select>
      </Labeled>

      {spec?.kind === "submit" && <p className="text-[11px] text-ink-dim">Al probar, envía los campos de la página. Para elegir el destino, añade la interacción «Enviar el formulario».</p>}
      {(spec?.kind === "button" || spec?.kind === "submit" || spec?.kind === "checkbox") && <p className="text-[11px] text-ink-dim">El texto es el del elemento: haz doble clic sobre él para cambiarlo.</p>}

      {field && (
        <Labeled label="Nombre del dato">
          <input value={spec.name} onChange={(e) => send({ name: e.target.value.trim() })} className={fieldClass} placeholder="correo" />
        </Labeled>
      )}
      {(spec?.kind === "input" || spec?.kind === "textarea") && (
        <Labeled label="Texto de ayuda">
          <input value={spec.placeholder ?? ""} onChange={(e) => send({ placeholder: e.target.value })} className={fieldClass} />
        </Labeled>
      )}
      {spec?.kind === "input" && (
        <Labeled label="Tipo de dato">
          <select value={spec.inputType ?? "text"} onChange={(e) => send({ inputType: e.target.value as InputType })} className={fieldClass}>
            {(Object.keys(INPUT_TYPE_LABELS) as InputType[]).map((type) => (
              <option key={type} value={type}>{INPUT_TYPE_LABELS[type]}</option>
            ))}
          </select>
        </Labeled>
      )}
      {spec?.kind === "select" && (
        <Labeled label="Opciones (una por línea)">
          <textarea
            value={(spec.options ?? []).join("\n")}
            onChange={(e) => send({ options: e.target.value.split("\n") })}
            className={`${fieldClass} h-auto min-h-16 resize-none py-1.5`}
          />
        </Labeled>
      )}
      {field && (
        <label className="flex items-center gap-2 text-xs text-ink">
          <input type="checkbox" checked={!!spec.required} onChange={(e) => send({ required: e.target.checked })} />
          Obligatorio
        </label>
      )}
    </Collapsible>
  );
}
