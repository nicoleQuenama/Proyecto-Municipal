import type { RecordedAnimation } from "./types";

interface StudioHeaderProps {
  animations: RecordedAnimation[];
  animation: RecordedAnimation;
  onSelect: (id: string) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

const field = "h-8 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent [&>option]:bg-panel";

/** La barra de arriba: elegir y nombrar la animación, eliminarla o cerrar el estudio. */
export function StudioHeader({ animations, animation, onSelect, onRename, onDelete, onClose }: StudioHeaderProps) {
  return (
    <header className="flex shrink-0 items-center gap-2 border-b border-line bg-panel px-3 py-2">
      <h2 className="mr-2 text-sm font-semibold">Animación</h2>
      <select aria-label="Animación" value={animation.id} onChange={(e) => onSelect(e.target.value)} className={field}>
        {animations.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
      <input aria-label="Nombre de la animación" value={animation.name} onChange={(e) => onRename(e.target.value)} className={`${field} w-56`} />
      <button type="button" onClick={onDelete} className="ml-auto h-8 rounded-md px-3 text-xs text-red-400 hover:bg-hover">Eliminar animación</button>
      <button type="button" onClick={onClose} className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-white">Listo</button>
    </header>
  );
}
