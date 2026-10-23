import type { RecordedAnimation } from "./types";

interface PreviewHeaderProps {
  animations: RecordedAnimation[];
  animation: RecordedAnimation;
  playing: boolean;
  total: number;
  onSelect: (id: string) => void;
  onRename: (name: string) => void;
  onToggle: () => void;
  onReplay: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const fieldClass = "h-8 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent [&>option]:bg-panel";
const buttonClass = "h-8 rounded-md px-3 text-xs hover:bg-hover";

/** La cabecera del modal: elegir y nombrar la animación, y los controles de reproducción. */
export function PreviewHeader({ animations, animation, playing, total, onSelect, onRename, onToggle, onReplay, onDelete, onClose }: PreviewHeaderProps) {
  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-line p-3">
      <select aria-label="Animación" value={animation.id} onChange={(e) => onSelect(e.target.value)} className={fieldClass}>
        {animations.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
      <input aria-label="Nombre de la animación" value={animation.name} onChange={(e) => onRename(e.target.value)} className={`${fieldClass} min-w-0 flex-1`} />
      <span className="text-xs text-ink-dim tabular-nums">
        Dura {(total / 1000).toFixed(1)} s
      </span>
      <button type="button" onClick={onToggle} className={buttonClass}>{playing ? "⏸ Pausa" : "▶ Reproducir"}</button>
      <button type="button" onClick={onReplay} className={`${buttonClass} bg-accent text-white`}>↻ Repetir</button>
      <button type="button" onClick={onDelete} className={`${buttonClass} text-red-400`}>Eliminar</button>
      <button type="button" onClick={onClose} className={buttonClass}>Cerrar</button>
    </header>
  );
}
