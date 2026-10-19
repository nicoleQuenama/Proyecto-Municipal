/**
 * Qué muestra y qué hace el menú de clic derecho según a qué se da formato.
 * Cada tipo de destino (elemento, sección…) tiene su constructor en `MODEL_BUILDERS`.
 */

import type { Dispatch } from "react";
import { elementLabel } from "../navigation/links";
import { clampPosition, FREE_OF_CONTAINER, type Resolver } from "../site/overrides";
import type {
  BlockBox,
  BlockInstance,
  CanvasElement,
  ComponentDef,
  ElementOverride,
  SiteAction,
} from "../site/types";
import { pixelsOf } from "../styles/apply";
import type { Variable } from "../styles/types";
import type { FormatTarget } from "./format-menu-context";
import { MOVE_STEPS } from "./format-options";
import type { CreateVariable } from "./format-variables";

export interface MenuMove {
  label: string;
  glyph: string;
  run: () => void;
}

export interface MenuAction {
  label: string;
  run: () => void;
  danger?: boolean;
}

/** Un valor que se puede cambiar, dejar ligado a una variable, o soltar de ella. */
export interface MenuField<T> {
  label: string;
  /** Lo que se ve ahora (ya con la variable resuelta); `undefined` si los elementos difieren. */
  value: T | undefined;
  /** Lo guardado en el bloque: `var(--nombre)` si usa una variable, o un valor suelto. */
  raw: string | number | undefined;
  set: (value: T | string) => void;
}

export interface MenuModel {
  title: string;
  /** Los elementos con texto que reciben el formato de texto (negrita, color, lista…). */
  textElements: CanvasElement[];
  applyText: (patch: ElementOverride) => void;
  fontFamily: MenuField<string>;
  fontSize: MenuField<number>;
  color: MenuField<string>;
  background: MenuField<string>;
  radius: MenuField<number>;
  moves: MenuMove[];
  actions: MenuAction[];
  /** Las variables que valen en este bloque, y cómo crear una nueva. */
  variables: Variable[];
  createVariable: CreateVariable;
}

/** Lo que un constructor necesita saber del bloque sobre el que se abrió el menú. */
export interface ModelEnv {
  pageId: string;
  block: BlockInstance;
  /** El componente tal como se ve en el bloque (con reglas, formato propio y variables resueltas). */
  view: ComponentDef;
  dispatch: Dispatch<SiteAction>;
  resolve: Resolver;
  variables: Variable[];
  createVariable: CreateVariable;
  /** Abre el código de este destino en el editor. */
  editCode: () => void;
  /** Selecciona el destino: el inspector de la derecha muestra su código propio e interacciones. */
  customize: (elementId?: string) => void;
}

const isTextual = (element: CanvasElement) => element.kind !== "image";

/** El valor que comparten todos, o `undefined` si no hay ninguno o difieren. */
function commonOf<T>(values: T[]): T | undefined {
  return values.length > 0 && values.every((value) => value === values[0]) ? values[0] : undefined;
}

/** Quita todo el formato propio de un elemento (lo oculto no se toca). */
const CLEARED_FORMAT: { [K in Exclude<keyof ElementOverride, "hidden">]: undefined } = {
  x: undefined,
  y: undefined,
  width: undefined,
  height: undefined,
  slot: undefined,
  offset: undefined,
  fitToParent: undefined,
  parentId: undefined,
  fill: undefined,
  radius: undefined,
  color: undefined,
  fontFamily: undefined,
  fontSize: undefined,
  bold: undefined,
  italic: undefined,
  underline: undefined,
  overline: undefined,
  strike: undefined,
  align: undefined,
  list: undefined,
};

type ElementField = "color" | "fontFamily" | "fontSize" | "fill" | "radius";

/** Un campo de formato de uno o varios elementos del bloque. */
function elementField<T extends string | number>(
  env: ModelEnv,
  elements: CanvasElement[],
  prop: ElementField,
  label: string,
  apply: (patch: ElementOverride) => void,
): MenuField<T> {
  return {
    label,
    value: commonOf(elements.map((element) => element[prop] as T)),
    raw: commonOf(elements.map((element) => env.block.elements?.[element.id]?.[prop])),
    set: (value) => apply({ [prop]: value }),
  };
}

type ModelBuilder<T extends FormatTarget> = (env: ModelEnv, target: T) => MenuModel | null;

const MODEL_BUILDERS: { [K in FormatTarget["kind"]]: ModelBuilder<Extract<FormatTarget, { kind: K }>> } = {
  element: (env, target) => {
    const { pageId, block, view, dispatch } = env;
    const element = view.elements.find((e) => e.id === target.elementId);
    if (!element) return null;

    const style = (patch: ElementOverride) =>
      dispatch({ type: "block/style", pageId, blockId: block.id, elementIds: [element.id], patch });
    const field = <T extends string | number>(prop: ElementField, label: string) =>
      elementField<T>(env, [element], prop, label, style);

    return {
      title: elementLabel(element),
      textElements: isTextual(element) ? [element] : [],
      applyText: style,
      fontFamily: field("fontFamily", "Tipografía"),
      fontSize: field("fontSize", "Tamaño de letra"),
      color: field("color", "Color de texto"),
      background: field("fill", "Fondo"),
      radius: field("radius", "Curveado"),
      moves: MOVE_STEPS.map(({ label, glyph, dx, dy }) => ({
        label,
        glyph,
        run: () => style({ ...clampPosition(element, view, element.x + dx, element.y + dy), ...FREE_OF_CONTAINER }),
      })),
      actions: [
        {
          label: "Ocultar elemento",
          run: () =>
            dispatch({
              type: "hidden/set",
              target: { kind: "element", pageId, blockId: block.id, elementId: element.id },
              hidden: true,
            }),
        },
        // Acoplado a un contenedor, el elemento puede adaptarse a su tamaño.
        ...(element.parentId === undefined
          ? []
          : [
              {
                label: element.fitToParent ? "Dejar de ajustar al contenedor" : "Ajustar al contenedor",
                run: () => style({ fitToParent: !element.fitToParent }),
              },
            ]),
        { label: "Editar código…", run: env.editCode },
        { label: "Interacciones…", run: () => env.customize(element.id) },
        { label: "Quitar formato", run: () => style(CLEARED_FORMAT) },
      ],
      variables: env.variables,
      createVariable: env.createVariable,
    };
  },

  block: (env) => {
    const { pageId, block, view, dispatch, resolve } = env;
    const textElements = view.elements.filter(isTextual);

    const style = (patch: ElementOverride) =>
      dispatch({ type: "block/style", pageId, blockId: block.id, elementIds: textElements.map((e) => e.id), patch });
    const box = (patch: BlockBox) => dispatch({ type: "block/box", pageId, blockId: block.id, patch });
    const field = <T extends string | number>(prop: ElementField, label: string) =>
      elementField<T>(env, textElements, prop, label, style);

    const radius = block.box?.radius;
    const background = block.box?.background;

    return {
      title: view.name,
      textElements,
      applyText: style,
      fontFamily: field("fontFamily", "Tipografía"),
      fontSize: field("fontSize", "Tamaño de letra"),
      color: field("color", "Color de texto"),
      background: {
        label: "Fondo de la sección",
        value: background === undefined ? undefined : resolve(background),
        raw: background,
        set: (value) => box({ background: value }),
      },
      radius: {
        label: "Esquinas de la sección",
        value: typeof radius === "string" ? pixelsOf(resolve(radius), 0) : (radius ?? 0),
        raw: radius,
        set: (value) => box({ radius: value }),
      },
      moves: [
        { label: "Subir sección", glyph: "↑", run: () => dispatch({ type: "block/move", pageId, blockId: block.id, direction: -1 }) },
        { label: "Bajar sección", glyph: "↓", run: () => dispatch({ type: "block/move", pageId, blockId: block.id, direction: 1 }) },
      ],
      actions: [
        { label: "Editar código…", run: env.editCode },
        { label: "Interacciones…", run: () => env.customize() },
        {
          label: "Ocultar sección",
          run: () => dispatch({ type: "hidden/set", target: { kind: "block", pageId, blockId: block.id }, hidden: true }),
        },
        { label: "Quitar formato", run: () => dispatch({ type: "block/reset", pageId, blockId: block.id }) },
        { label: "Eliminar sección", danger: true, run: () => dispatch({ type: "block/remove", id: block.id }) },
      ],
      variables: env.variables,
      createVariable: env.createVariable,
    };
  },
};

/** El modelo del menú para un destino, o null si ya no existe. */
export function buildMenuModel(env: ModelEnv, target: FormatTarget): MenuModel | null {
  const build = MODEL_BUILDERS[target.kind] as ModelBuilder<FormatTarget>;
  return build(env, target);
}
