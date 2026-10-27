"use client";

import { useState, type ReactNode } from "react";
import { ACTIONS } from "../behaviors/actions";
import { hasPermission, useAuth } from "../auth/auth-context";
import { ExportButton } from "../export/export-button";
import { mineLabel, useSharedUsage } from "../site/use-shared-usage";
import { useCanvasSettings } from "../canvas-editing/settings-context";
import { elementLabel } from "../navigation/links";
import { useSite, useSiteDispatch } from "../site/site-context";
import { SECTION_KEY, TITLE_SELECTION, type BlockInstance, type ComponentDef, type CustomStyle } from "../site/types";
import { Collapsible } from "../ui/collapsible";
import { CodeIcon } from "../viewport/icons";
import { useWorkbench } from "../workbench/workbench-context";
import { BindingControls } from "../data-sources/binding-controls";
import { LinkParamsControls } from "../dynamic/link-params-controls";
import { RepeatControls } from "../data-sources/repeat-controls";
import { SectionBackground } from "../background/section-background";
import { IconPicker } from "../icons/icon-picker";
import { AltControl } from "./alt-control";
import { LayerControls } from "./layer-controls";
import { BehaviorEditor } from "./behavior-editor";
import { RemoveButton } from "./remove-button";
import { HideOnControls } from "./hide-on-controls";

const fieldClass =
  "h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent";

/** El número de cosas que hay dentro de un grupo cerrado; no se muestra si no hay ninguna. */
const count = (value: number): ReactNode =>
  value > 0 ? <span className="rounded bg-accent/25 px-1.5 py-0.5 text-[10px] text-accent">{value}</span> : null;

const Hint = ({ children }: { children: ReactNode }) => <p className="text-[11px] text-ink-dim">{children}</p>;

type StyleLevel = "block" | "component";

const STYLE_LEVELS: { value: StyleLevel; label: string }[] = [
  { value: "block", label: "Solo este bloque" },
  { value: "component", label: "Todo el componente" },
];

/** Las clases de Tailwind: varias líneas que se ajustan al ancho y se aplican a cada tecla, sin salir del campo. */
function ClassesField({ value, onChange }: { value: string; onChange: (classes: string) => void }) {
  const [text, setText] = useState(value);

  return (
    <textarea
      aria-label="Clases de Tailwind"
      placeholder="flex items-center gap-4 rounded-xl shadow-lg bg-primario"
      value={text}
      spellCheck={false}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value);
      }}
      onBlur={() => onChange(text.trim().replace(/\s+/g, " "))}
      className={`${fieldClass} field-sizing-content h-auto min-h-16 resize-none py-1.5 font-mono leading-5`}
    />
  );
}

interface ScopeEditorProps {
  pageId: string;
  block: BlockInstance;
  def: ComponentDef;
  /** `SECTION_KEY` para la sección entera, o el id de uno de sus elementos. */
  scope: string;
}

/** Clases, interacciones y acceso al código (en el editor) de una sección o de uno de sus elementos. */
function ScopeEditor({ pageId, block, def, scope }: ScopeEditorProps) {
  const { pages } = useSite();
  const dispatch = useSiteDispatch();
  const { openFile } = useWorkbench();
  const { currentUser } = useAuth();
  // Los estilos valen para este bloque o, si se elige, para todos los lugares donde se use el componente.
  // El alcance es el mismo que usan los gestos y la barra de formato: lo que se elige aquí vale en todas partes.
  const { settings, setSettings } = useCanvasSettings();
  const level: StyleLevel = settings.scope;
  const mine = mineLabel(useSharedUsage());
  const setLevel = (value: StyleLevel) => setSettings((current) => ({ ...current, scope: value }));
  const custom = (level === "block" ? block.custom?.[scope] : def.styles?.[scope]) ?? { classes: "", css: "" };
  const canEditContent = hasPermission(currentUser, "editContent");
  const canEditStyles = hasPermission(currentUser, "editStyles");
  const canEditCode = hasPermission(currentUser, "editCode");

  const saveStyle = (patch: Partial<CustomStyle>) => {
    if (!canEditStyles) return;
    dispatch(
      level === "block"
        ? { type: "block/custom", pageId, blockId: block.id, key: scope, patch }
        : { type: "component/styles", componentId: def.id, key: scope, patch },
    );
  };
  const openCss = () => {
    if (!canEditCode) return;
    openFile(
      level === "block"
        ? { kind: "custom-css", pageId, blockId: block.id, key: scope }
        : { kind: "component-css", componentId: def.id, key: scope },
    );
  };

  const behaviors = (block.behaviors ?? []).filter((b) => b.scope === scope);
  const add = () => {
    if (!canEditContent) return;
    dispatch({
      type: "behavior/save",
      pageId,
      blockId: block.id,
      behavior: { id: crypto.randomUUID(), scope, trigger: "click", action: ACTIONS.animate.create(pages) },
    });
  };

  const element = def.elements.find((e) => e.id === scope);

  return (
    <div className="flex flex-col gap-4">
      <HideOnControls pageId={pageId} block={block} def={def} elementId={element?.id} />
      {element?.kind === "icon" && canEditContent && (
        <Collapsible title="Ícono">
          <IconPicker
            value={element.icon ?? "star"}
            onPick={(icon) => dispatch({ type: "component/icon", componentId: def.id, pageId, blockId: block.id, elementId: element.id, icon })}
          />
        </Collapsible>
      )}
      {element && <AltControl pageId={pageId} block={block} element={element} />}
      {element ? <BindingControls pageId={pageId} block={block} element={element} /> : <RepeatControls pageId={pageId} block={block} />}
      {element && <LinkParamsControls pageId={pageId} block={block} element={element} />}
      {!element && <SectionBackground pageId={pageId} block={block} />}
      {!element && canEditContent && <LayerControls pageId={pageId} block={block} />}

      {canEditContent && (
        <Collapsible title="Interacciones" badge={count(behaviors.length)}>
          <Hint>Qué pasa al hacer clic, pasar el cursor… Se ven al pulsar «Probar» (▶).</Hint>
          {behaviors.length > 0 && (
            <ul className="flex flex-col gap-2">
              {behaviors.map((behavior) => (
                <BehaviorEditor
                  key={behavior.id}
                  behavior={behavior}
                  pages={pages}
                  elements={def.elements}
                  onChange={(next) => {
                    if (!canEditContent) return;
                    dispatch({ type: "behavior/save", pageId, blockId: block.id, behavior: next });
                  }}
                  onRemove={() => {
                    if (!canEditContent) return;
                    dispatch({ type: "behavior/remove", pageId, blockId: block.id, behaviorId: behavior.id });
                  }}
                  onOpenCode={() => canEditCode && openFile({ kind: "behavior-js", pageId, blockId: block.id, behaviorId: behavior.id })}
                />
              ))}
            </ul>
          )}
          <button type="button" onClick={add} className="h-9 rounded-md border border-dashed border-line text-xs hover:bg-hover">
            + Añadir interacción
          </button>
        </Collapsible>
      )}

      {canEditStyles && (
        <div role="group" aria-label="Dónde valen los estilos" className="flex flex-col gap-1.5">
          <div className="grid grid-cols-2 gap-1 rounded-md bg-canvas p-1 text-[11px]">
            {STYLE_LEVELS.map(({ value, label: base }) => {
              const label = value === "component" && mine ? mine.label : base;
              return (
              <button
                key={value}
                type="button"
                aria-pressed={level === value}
                onClick={() => setLevel(value)}
                className={`h-7 rounded ${level === value ? "bg-accent/25 text-accent" : "text-ink-dim hover:text-ink"}`}
              >
                {label}
              </button>
              );
            })}
          </div>
          <Hint>
            {level === "block"
              ? "Solo cambia esta sección, en esta página."
              : (mine?.hint ?? `Cambia todos los «${def.name}» del sitio, en todas las páginas.`)}
          </Hint>
        </div>
      )}

      {canEditStyles && (
        <Collapsible title="Clases de Tailwind" badge={count(custom.classes.split(/\s+/).filter(Boolean).length)}>
          {/* key: al cambiar de alcance el campo empieza con lo guardado de ese alcance. */}
          <ClassesField key={level} value={custom.classes} onChange={(classes) => saveStyle({ classes })} />
          <Hint>Se aplican al escribir. Cualquier clase de Tailwind; las variables del proyecto también: «color-primario» da «bg-primario» y «text-primario».</Hint>
        </Collapsible>
      )}

      {canEditCode && (
        <Collapsible title="CSS propio" defaultOpen={false} badge={count(custom.css.trim() ? 1 : 0)}>
          <button
            type="button"
            onClick={openCss}
            className="flex h-9 items-center justify-center gap-2 rounded-md border border-line text-xs hover:bg-hover"
          >
            <CodeIcon />
            Abrir el CSS en el editor
          </button>
          <Hint>{level === "block" ? "Solo afecta a este elemento." : "Afecta a este elemento en todos los bloques del componente."} Puedes usar las variables del proyecto: «var(--color-primario)».</Hint>
        </Collapsible>
      )}
    </div>
  );
}

/**
 * El inspector de propiedades: aparece a la derecha solo cuando hay una sección o un elemento seleccionado,
 * con su código propio e interacciones. Así el panel izquierdo queda para agregar y organizar.
 */
export function Inspector() {
  const { pages, currentPageId, selectedId, selectedElementId, components } = useSite();
  const dispatch = useSiteDispatch();
  const { openFile } = useWorkbench();
  const { currentUser } = useAuth();
  const canEditCode = hasPermission(currentUser, "editCode");

  const page = pages.find((p) => p.id === currentPageId);
  const block = page?.blocks.find((b) => b.id === selectedId);
  const def = components.find((c) => c.id === block?.componentId);
  if (!page || !block || !def) return null;

  const element = def.elements.find((e) => e.id === selectedElementId);
  const scope = element ? element.id : SECTION_KEY;

  return (
    <aside
      aria-label="Propiedades"
      className="my-3 mr-3 flex w-80 shrink-0 flex-col self-stretch overflow-hidden rounded-xl border border-line bg-panel text-ink shadow-2xl"
    >
      <header className="flex h-12 shrink-0 items-center gap-1 border-b border-line px-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] tracking-wider text-ink-dim uppercase">{element ? `Elemento · ${def.name}` : "Sección"}</p>
          <p className="truncate text-sm font-medium">{element ? elementLabel(element) : def.name}</p>
        </div>
        {canEditCode && <ExportButton pageId={page.id} block={block} def={def} />}
        {canEditCode && (
          <button
            type="button"
            aria-label="Abrir el código en el editor"
            title="Abrir el código en el editor (Ctrl+E)"
            onClick={() => openFile()}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-accent px-2.5 text-xs font-medium text-white hover:opacity-90"
          >
            <CodeIcon />
            Código
          </button>
        )}
        <button
          type="button"
          aria-label="Cerrar propiedades"
          title="Cerrar propiedades"
          onClick={() => dispatch({ type: "block/select", id: TITLE_SELECTION })}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink"
        >
          ×
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {/* key: al cambiar de selección, el editor empieza de cero con lo guardado de esa selección. */}
        <ScopeEditor key={`${block.id}:${scope}`} pageId={page.id} block={block} def={def} scope={scope} />
      </div>
      <RemoveButton page={page} />
    </aside>
  );
}
