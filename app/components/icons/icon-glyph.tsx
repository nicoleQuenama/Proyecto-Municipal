import { ICON_PATHS, type IconName } from "./icon-set";

interface IconGlyphProps {
  name: IconName;
  size?: number;
  /** Color del trazo; por defecto el del texto que lo rodea. */
  color?: string;
  strokeWidth?: number;
  className?: string;
}

/** Dibuja un ícono de trazo del conjunto. */
export function IconGlyph({ name, size = 24, color = "currentColor", strokeWidth = 2, className }: IconGlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {ICON_PATHS[name].map((d, index) => (
        <path key={index} d={d} />
      ))}
    </svg>
  );
}
