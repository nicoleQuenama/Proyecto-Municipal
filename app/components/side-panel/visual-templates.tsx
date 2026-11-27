"use client";

import { hasPermission, useAuth } from "../auth/auth-context";
import { useCommands } from "../commands/commands-context";
import { ComponentThumb } from "../site/component-view";
import { duplicateComponent } from "../site/rules";
import { uniqueComponentName } from "../site/unique-component-name";
import { useCurrentPage, useSite, useSiteDispatch } from "../site/site-context";

export function VisualTemplates() {
  const { components } = useSite();
  const page = useCurrentPage();
  const dispatch = useSiteDispatch();
  const { openBuilder } = useCommands();
  const { currentUser } = useAuth();
  const canEdit = hasPermission(currentUser, "editContent");
  const templates = components.filter((item) => !item.codeKind && item.templateFor === "section");

  const add = (template: (typeof templates)[number]) => {
    const id = crypto.randomUUID();
    const name = uniqueComponentName(components, `${template.name} (copia)`);
    const { templateFor: _templateFor, ...copy } = duplicateComponent(template, id, name);
    dispatch({ type: "component/save", component: copy });
    dispatch({ type: "block/add", id: crypto.randomUUID(), componentId: id, pageId: page.id });
  };

  if (!templates.length) return null;
  return <section aria-label="Plantillas visuales" className="flex flex-col gap-3">
    <p className="text-[11px] font-semibold tracking-wider text-ink-dim uppercase">Plantillas visuales ({templates.length})</p>
    {templates.map((template) => <article key={template.id} className="rounded-xl border border-line bg-canvas/40 p-3">
      <div className="flex h-28 items-center justify-center overflow-hidden rounded-lg border border-line/50 bg-white"><ComponentThumb def={template} size={80} /></div>
      <h4 className="mt-2 text-[13px] font-semibold text-ink">{template.name}</h4>
      <p className="text-xs text-ink-dim">Sección visual editable</p>
      <div className="mt-2 flex justify-end gap-2 border-t border-line/50 pt-2">
        <button type="button" disabled={!canEdit} onClick={() => openBuilder(template)} className="rounded-md bg-hover px-3 py-1.5 text-xs text-ink disabled:opacity-50 cursor-pointer">Editar molde</button>
        <button type="button" disabled={!canEdit} onClick={() => add(template)} className="rounded-md bg-accent px-3 py-1.5 text-xs text-white disabled:opacity-50 cursor-pointer">Agregar copia</button>
        <button type="button" disabled={!canEdit} aria-label={`Eliminar ${template.name}`} onClick={() => dispatch({ type: "component/delete", id: template.id })} className="px-2 text-ink-dim hover:text-red-400 disabled:opacity-50 cursor-pointer">×</button>
      </div>
    </article>)}
  </section>;
}
