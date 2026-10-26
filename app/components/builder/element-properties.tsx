"use client";

import type { Dispatch } from "react";
import { LinkEditor } from "../navigation/link-editor";
import { elementLabel, isLinkable } from "../navigation/links";
import { ROLE_LABELS } from "../styles/registry";
import type { CanvasElement } from "../site/types";
import { NumberField } from "../ui/number-field";
import type { BuilderAction, BuilderState } from "./builder-reducer";
import { DockSection } from "./dock-section";
import { KIND_TRAITS } from "./kind-traits";
import { IconProperties } from "./icon-properties";
import { MediaSourceSection } from "./media-source-section";
import { actionButton, ColorField, Field, inputClass } from "./panel-fields";
import { TextProperties } from "./text-properties";

interface ElementPropertiesProps {
  element: CanvasElement;
  state: BuilderState;
  dispatch: Dispatch<BuilderAction>;
  newId: () => string;
}

/** Las propiedades del elemento seleccionado; qué secciones se muestran lo dice `KIND_TRAITS`. */
export function ElementProperties({ element, state, dispatch, newId }: ElementPropertiesProps) {
  const traits = KIND_TRAITS[element.kind];
  const patch = (changes: Partial<CanvasElement>) => dispatch({ type: "update", id: element.id, patch: changes });

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[11px] font-semibold tracking-wider text-ink-dim uppercase">{traits.label}</h3>

      <Field label="Rol (qué reglas de Apariencia sigue)">
        <select
          value={element.role}
          onChange={(e) => patch({ role: e.target.value as CanvasElement["role"] })}
          className={inputClass}
        >
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {element.role !== "none" && (
          <span className="text-[11px] leading-snug">
            En la página, este elemento usa las reglas de «{ROLE_LABELS[element.role]}». Aquí ves sus valores propios.
          </span>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <NumberField label="X" value={element.x} onChange={(x) => patch({ x })} />
        <NumberField label="Y" value={element.y} onChange={(y) => patch({ y })} />
        <NumberField label="Ancho" value={element.width} onChange={(width) => patch({ width })} />
        <NumberField label="Alto" value={element.height} onChange={(height) => patch({ height })} />
      </div>

      <DockSection element={element} parent={state.elements.find((e) => e.id === element.parentId)} dispatch={dispatch} />

      {traits.hasFill && <ColorField label="Relleno" value={element.fill} gradient onChange={(fill) => patch({ fill })} />}
      {traits.hasRadius && (
        <NumberField label="Esquinas redondeadas" value={element.radius} min={0} onChange={(radius) => patch({ radius })} />
      )}
      {traits.hasMedia && <MediaSourceSection element={element} onChange={patch} />}
      {traits.hasIcon && <IconProperties element={element} onChange={patch} />}
      {traits.hasText && <TextProperties element={element} onChange={patch} />}

      {isLinkable(element) && (
        <div className="flex flex-col gap-1.5 border-t border-line pt-3">
          <span className="text-[11px] text-ink-dim">Enlace</span>
          <LinkEditor
            label={elementLabel(element)}
            link={state.links[element.id]}
            onChange={(link) => dispatch({ type: "link", id: element.id, link })}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 border-t border-line pt-3">
        <button type="button" className={actionButton} onClick={() => dispatch({ type: "reorder", id: element.id, to: "front" })}>Al frente</button>
        <button type="button" className={actionButton} onClick={() => dispatch({ type: "reorder", id: element.id, to: "back" })}>Al fondo</button>
        <button type="button" className={actionButton} onClick={() => dispatch({ type: "duplicate", id: element.id, newId: newId() })}>Duplicar</button>
        <button
          type="button"
          className={`${actionButton} text-red-400 hover:bg-red-500/15`}
          onClick={() => dispatch({ type: "remove", id: element.id })}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
