"use client";

import { useRef, type ReactNode } from "react";
import { applyOverrides } from "../site/overrides";
import { SECTION_KEY } from "../site/types";
import { useSite, useSiteDispatch } from "../site/site-context";
import { availableVariables } from "../styles/resolve";
import { useStyles } from "../styles/use-styles";
import { FONT_OPTIONS } from "../title-editor/constants";
import { TopLayer } from "../ui/top-layer";
import { useDismiss } from "../ui/use-dismiss";
import { useWorkbench } from "../workbench/workbench-context";
import { ActionButton, ColorField, MenuGroup, ToggleButton } from "./format-controls";
import { useFormatMenu } from "./format-menu-context";
import { buildMenuModel, type MenuModel } from "./format-model";
import {
  ALIGNS,
  colorInputValue,
  LISTS,
  MAX_FONT_SIZE,
  MAX_RADIUS,
  MIN_FONT_SIZE,
  toSizeValue,
  TOGGLES,
} from "./format-options";
import { makeCreateVariable } from "./format-variables";
import { VariableSelect } from "./variable-select";

const WIDTH = 288;
const ESTIMATED_HEIGHT = 470;
const MARGIN = 8;

const fieldClass =
  "h-8 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent [&>option]:bg-panel";

/** Lo que tienen en común los elementos con texto (si todos lo cumplen, el botón se ve encendido). */
function commonValue<T>(model: MenuModel, read: (element: MenuModel["textElements"][number]) => T): T | undefined {
  const values = model.textElements.map(read);
  return values.length > 0 && values.every((value) => value === values[0]) ? values[0] : undefined;
}

/** Un control con, al lado, el selector de variables del proyecto. */
function WithVariable({ control, variable }: { control: ReactNode; variable: ReactNode }) {
  return (
    <div className="flex items-start gap-1.5">
      <div className="min-w-0 flex-1">{control}</div>
      <div className="w-28 shrink-0">{variable}</div>
    </div>
  );
}

function TextControls({ model }: { model: MenuModel }) {
  const none = model.textElements.length === 0;
  const align = commonValue(model, (e) => e.align);
  const list = commonValue(model, (e) => e.list ?? "none");
  const known = FONT_OPTIONS.some((font) => font.value === model.fontFamily.value);
  const shared = { variables: model.variables, createVariable: model.createVariable };

  return (
    <>
      <MenuGroup title="Texto">
        <WithVariable
          control={
            <select
              aria-label="Tipografía"
              disabled={none}
              value={known ? model.fontFamily.value : ""}
              onChange={(e) => model.fontFamily.set(e.target.value)}
              className={`${fieldClass} w-full`}
            >
              <option value="">Heredada</option>
              {FONT_OPTIONS.map((font) => (
                <option key={font.value} value={font.value}>{font.label}</option>
              ))}
            </select>
          }
          variable={
            <VariableSelect
              {...shared}
              kind="font"
              label="Variable de tipografía"
              raw={model.fontFamily.raw}
              literal={model.fontFamily.value || FONT_OPTIONS[0].value}
              onChange={model.fontFamily.set}
            />
          }
        />

        <WithVariable
          control={
            <input
              type="number"
              aria-label="Tamaño de letra"
              disabled={none}
              min={MIN_FONT_SIZE}
              max={MAX_FONT_SIZE}
              value={model.fontSize.value ?? ""}
              onChange={(e) => {
                const size = Number(e.target.value);
                if (size >= MIN_FONT_SIZE && size <= MAX_FONT_SIZE) model.fontSize.set(size);
              }}
              className={`${fieldClass} w-full`}
            />
          }
          variable={
            <VariableSelect
              {...shared}
              kind="size"
              label="Variable del tamaño de letra"
              raw={model.fontSize.raw}
              literal={`${model.fontSize.value ?? 16}px`}
              onChange={(raw) => model.fontSize.set(toSizeValue(raw))}
            />
          }
        />

        <div className="flex flex-wrap gap-0.5">
          {TOGGLES.map(({ key, label, glyph, glyphStyle }) => {
            const active = commonValue(model, (e) => e[key] === true) === true;
            return (
              <ToggleButton
                key={key}
                label={label}
                active={active}
                disabled={none}
                onClick={() => model.applyText({ [key]: !active })}
                style={glyphStyle}
              >
                {glyph}
              </ToggleButton>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-0.5">
          {ALIGNS.map(({ value, label, glyph }) => (
            <ToggleButton
              key={value}
              label={label}
              active={align === value}
              disabled={none}
              onClick={() => model.applyText({ align: value })}
            >
              {glyph}
            </ToggleButton>
          ))}
          {LISTS.map(({ value, label, glyph }) => (
            <ToggleButton
              key={value}
              label={label}
              active={list === value}
              disabled={none}
              onClick={() => model.applyText({ list: list === value ? "none" : value })}
            >
              {glyph}
            </ToggleButton>
          ))}
        </div>
      </MenuGroup>

      <MenuGroup title="Color">
        <WithVariable
          control={
            <ColorField label={model.color.label} disabled={none} value={model.color.value} onChange={model.color.set} />
          }
          variable={
            <VariableSelect
              {...shared}
              kind="color"
              label="Variable del color de texto"
              raw={model.color.raw}
              literal={colorInputValue(model.color.value)}
              onChange={model.color.set}
            />
          }
        />
        <WithVariable
          control={
            <ColorField label={model.background.label} value={model.background.value} onChange={model.background.set} />
          }
          variable={
            <VariableSelect
              {...shared}
              kind="color"
              label="Variable del fondo"
              raw={model.background.raw}
              literal={colorInputValue(model.background.value, "#ffffff")}
              onChange={model.background.set}
            />
          }
        />
      </MenuGroup>
    </>
  );
}

function MenuBody({ model, close }: { model: MenuModel; close: () => void }) {
  return (
    <>
      <p className="truncate border-b border-line px-3 py-2 text-xs font-medium">{model.title}</p>

      <TextControls model={model} />

      <MenuGroup title={model.radius.label}>
        <WithVariable
          control={
            <input
              type="range"
              aria-label={model.radius.label}
              min={0}
              max={MAX_RADIUS}
              value={model.radius.value ?? 0}
              onChange={(e) => model.radius.set(Number(e.target.value))}
              className="w-full accent-accent"
            />
          }
          variable={
            <VariableSelect
              variables={model.variables}
              createVariable={model.createVariable}
              kind="size"
              label="Variable de las esquinas"
              raw={model.radius.raw}
              literal={`${model.radius.value ?? 0}px`}
              onChange={(raw) => model.radius.set(toSizeValue(raw))}
            />
          }
        />
      </MenuGroup>

      <MenuGroup title="Mover">
        <div className="flex gap-0.5">
          {model.moves.map((move) => (
            <ActionButton key={move.label} label={move.label} onClick={move.run}>
              {move.glyph}
            </ActionButton>
          ))}
        </div>
      </MenuGroup>

      <MenuGroup>
        <div className="flex flex-col">
          {model.actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                action.run();
                close();
              }}
              className={`h-8 rounded-md px-2 text-left text-xs ${
                action.danger ? "text-red-400 hover:bg-red-500/15" : "text-ink hover:bg-hover"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </MenuGroup>
    </>
  );
}

/** El menú de clic derecho: formato de un elemento o de una sección, como en un procesador de texto. */
export function FormatMenu() {
  const { menu, closeFormatMenu } = useFormatMenu();
  const site = useSite();
  const dispatch = useSiteDispatch();
  const styles = useStyles(menu?.target.pageId);
  const { openFile } = useWorkbench();
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, menu !== null, closeFormatMenu);

  const page = site.pages.find((p) => p.id === menu?.target.pageId);
  const block = page?.blocks.find((b) => b.id === menu?.target.blockId);
  const def = site.components.find((c) => c.id === block?.componentId);
  if (!menu || !page || !block || !def) return null;

  const resolve = styles.resolver(def.id);
  const model = buildMenuModel(
    {
      pageId: page.id,
      block,
      view: applyOverrides(styles.component(def), block, resolve),
      dispatch,
      resolve,
      variables: availableVariables(site.variables, { pageId: page.id, componentId: def.id }),
      createVariable: makeCreateVariable(site.variables, dispatch),
      editCode: () => {
        const key = menu.target.kind === "element" ? menu.target.elementId : SECTION_KEY;
        openFile(
          block.code
            ? { kind: "block-html", pageId: page.id, blockId: block.id }
            : { kind: "custom-css", pageId: page.id, blockId: block.id, key },
        );
        closeFormatMenu();
      },
      customize: (elementId) => {
        dispatch({ type: "block/select", id: block.id });
        dispatch({ type: "element/select", id: elementId ?? null });
      },
    },
    menu.target,
  );
  if (!model) return null;

  const left = Math.max(MARGIN, Math.min(menu.point.x, window.innerWidth - WIDTH - MARGIN));
  const top = Math.max(MARGIN, Math.min(menu.point.y, window.innerHeight - ESTIMATED_HEIGHT - MARGIN));

  return (
    <TopLayer
      ref={ref}
      role="menu"
      aria-label={`Formato de ${model.title}`}
      className="fixed overflow-y-auto rounded-xl border border-line bg-panel text-ink shadow-2xl"
      style={{ left, top, width: WIDTH, maxHeight: window.innerHeight - top - MARGIN }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <MenuBody model={model} close={closeFormatMenu} />
    </TopLayer>
  );
}
