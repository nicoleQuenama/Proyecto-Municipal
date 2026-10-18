"use client";

import type { ReactNode } from "react";
import type { Field } from "../behaviors/actions";
import type { CodeMode } from "../behaviors/types";
import { DEFAULT_TRANSITION, elementLabel } from "../navigation/links";
import { TransitionFields } from "../navigation/transition-fields";
import type { Transition } from "../navigation/types";
import { SECTION_KEY, type CanvasElement, type Page } from "../site/types";
import { CodeIcon } from "../viewport/icons";

const fieldClass =
  "h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent [&>option]:bg-panel";

/** Lo que recibe el dibujo de un campo de una acción. */
export interface FieldContext {
  value: unknown;
  onChange: (value: unknown) => void;
  pages: Page[];
  /** Los elementos de la sección, para elegir sobre cuál actuar. */
  elements: CanvasElement[];
  /** Abre el código de la interacción en el editor. */
  openCode: () => void;
  mode: CodeMode;
  setMode: (mode: CodeMode) => void;
}

type Renderer<T extends Field["type"]> = (field: Extract<Field, { type: T }>, context: FieldContext) => ReactNode;

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
      {label}
      {children}
    </label>
  );
}

const optionsOf = (options: { value: string; label: string }[]) =>
  options.map((option) => (
    <option key={option.value} value={option.value}>{option.label}</option>
  ));

/** Dónde se ejecuta el código de una interacción. */
const MODE_OPTIONS: { value: CodeMode; label: string }[] = [
  { value: "page", label: "En la página (permite usar librerías)" },
  { value: "isolated", label: "Aislado (más seguro, solo usa api)" },
];

/** Cómo se dibuja cada tipo de campo. Un tipo de campo nuevo es una entrada nueva. */
export const FIELD_RENDERERS: { [T in Field["type"]]: Renderer<T> } = {
  page: (field, { value, onChange, pages }) => (
    <Labeled label={field.label}>
      <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
        {pages.map((page) => (
          <option key={page.id} value={page.id}>{page.name}</option>
        ))}
      </select>
    </Labeled>
  ),

  select: (field, { value, onChange }) => (
    <Labeled label={field.label}>
      <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
        {optionsOf(field.options)}
      </select>
    </Labeled>
  ),

  target: (field, { value, onChange, elements }) => (
    <Labeled label={field.label}>
      <select value={String(value ?? SECTION_KEY)} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
        {optionsOf([
          { value: SECTION_KEY, label: "Esta sección completa" },
          ...elements.map((element) => ({ value: element.id, label: elementLabel(element) })),
        ])}
      </select>
    </Labeled>
  ),

  number: (field, { value, onChange }) => (
    <Labeled label={field.label}>
      <input
        type="number"
        min={field.min}
        max={field.max}
        step={field.step}
        value={Number(value ?? field.min)}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (next >= field.min && next <= field.max) onChange(next);
        }}
        className={fieldClass}
      />
    </Labeled>
  ),

  text: (field, { value, onChange }) => (
    <Labeled label={field.label}>
      <input
        value={String(value ?? "")}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass}
      />
    </Labeled>
  ),

  // El código se escribe en el editor a pantalla completa; aquí solo se abre y se elige dónde corre.
  code: (field, { value, openCode, mode, setMode }) => {
    const lines = String(value ?? "").split("\n").filter((line) => line.trim()).length;
    return (
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={openCode}
          className="flex h-9 items-center justify-center gap-2 rounded-md border border-line text-xs hover:bg-hover"
        >
          <CodeIcon />
          Editar {field.label} en el editor · {lines} {lines === 1 ? "línea" : "líneas"}
        </button>
        <Labeled label="Ejecutar">
          <select value={mode} onChange={(e) => setMode(e.target.value as CodeMode)} className={fieldClass}>
            {optionsOf(MODE_OPTIONS)}
          </select>
        </Labeled>
        <p className="text-[11px] text-ink-dim">{field.hint}</p>
      </div>
    );
  },

  transition: (field, { value, onChange }) => {
    const custom = value as Transition | undefined;
    return (
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={custom === undefined}
            onChange={(e) => onChange(e.target.checked ? undefined : DEFAULT_TRANSITION)}
            className="h-3.5 w-3.5 accent-accent"
          />
          {field.label}: la del sitio
        </label>
        {custom && <TransitionFields label="Animación" value={custom} onChange={onChange} />}
      </div>
    );
  },
};
