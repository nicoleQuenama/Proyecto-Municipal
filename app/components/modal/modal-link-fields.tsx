"use client";

import { useNavigation } from "../navigation/navigation-context";
import type { LinkTarget } from "../navigation/types";
import { useSite } from "../site/site-context";
import { resolveModalOptions } from "./modal-options";
import { OptionCards } from "../ui/option-cards";
import { ANIMATION_OPTIONS, POSITION_OPTIONS, SIZE_OPTIONS } from "./option-previews";
import type { ModalOptions } from "./types";

type ModalLink = Extract<LinkTarget, { kind: "modal" }>;

const selectClass =
  "h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent [&>option]:bg-panel";

const VEILS: { label: string; color: string }[] = [
  { label: "Oscuro", color: "rgba(0,0,0,0.55)" },
  { label: "Suave", color: "rgba(0,0,0,0.25)" },
  { label: "Claro", color: "rgba(255,255,255,0.7)" },
  { label: "Ninguno", color: "transparent" },
];

interface ModalLinkFieldsProps {
  link: ModalLink;
  onChange: (link: LinkTarget) => void;
  label: string;
}

/** Los ajustes de un enlace «ventana modal»: página, tamaño, posición, animación, velo y cierre. */
export function ModalLinkFields({ link, onChange, label }: ModalLinkFieldsProps) {
  const { pages } = useSite();
  const { followLink } = useNavigation();
  const options = resolveModalOptions(link.options);
  const set = (patch: Partial<ModalOptions>) => onChange({ ...link, options: { ...link.options, ...patch } });
  const target = pages.find((page) => page.id === link.pageId);

  return (
    <div className="flex flex-col gap-2.5">
      <select
        aria-label={`${label}: página que se abre en la ventana`}
        value={link.pageId}
        onChange={(e) => onChange({ ...link, pageId: e.target.value, params: undefined })}
        className={selectClass}
      >
        {!target && <option value={link.pageId}>(página eliminada)</option>}
        {pages.map((page) => (
          <option key={page.id} value={page.id}>{page.route ? `${page.name} · ${page.route}` : page.name}</option>
        ))}
      </select>

      <p className="text-[11px] text-ink-dim">
        {target?.route
          ? "Página dinámica: selecciona el elemento en el lienzo y rellena sus datos en el panel de la derecha."
          : "Se muestra el contenido de esa página sobre la actual, sin salir de ella."}
      </p>

      <OptionCards label="Tamaño" value={options.size} options={SIZE_OPTIONS} onChange={(size) => set({ size })} />
      <OptionCards label="Posición" value={options.position} options={POSITION_OPTIONS} onChange={(position) => set({ position })} />
      <OptionCards label="Animación al abrir" value={options.animation} options={ANIMATION_OPTIONS} onChange={(animation) => set({ animation })} />

      <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
        Velo (lo de alrededor)
        <select aria-label={`${label}: velo`} value={options.backdrop} onChange={(e) => set({ backdrop: e.target.value })} className={selectClass}>
          {!VEILS.some((veil) => veil.color === options.backdrop) && <option value={options.backdrop}>Personalizado</option>}
          {VEILS.map((veil) => <option key={veil.color} value={veil.color}>{veil.label}</option>)}
        </select>
      </label>

      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={options.closeOnBackdrop} onChange={(e) => set({ closeOnBackdrop: e.target.checked })} className="h-3.5 w-3.5 accent-accent" />
        Cerrar al pulsar fuera de la ventana
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={options.showClose} onChange={(e) => set({ showClose: e.target.checked })} className="h-3.5 w-3.5 accent-accent" />
        Mostrar el botón × para cerrar
      </label>

      <button
        type="button"
        onClick={() => followLink(link)}
        className="h-8 rounded-md border border-sky-500/60 px-2 text-xs text-sky-400 hover:bg-sky-500/10"
      >
        Ver la ventana modal
      </button>
    </div>
  );
}
