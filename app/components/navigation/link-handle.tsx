"use client";

import { LinkIcon } from "../viewport/icons";
import { useHandleSize } from "../viewport/use-handle-size";
import { linkArrow } from "./links";
import { useNavigation } from "./navigation-context";
import type { ElementRef, LinkTarget } from "./types";

interface LinkHandleProps {
  element: ElementRef;
  link: LinkTarget | undefined;
  label: string;
}

/**
 * El ícono de enlace de un elemento. Arrastrarlo hasta una página la enlaza; un clic abre el editor
 * (página, URL externa, transición). Sirve igual en una barra, en el contenido o en un pie.
 */
export function LinkHandle({ element, link, label }: LinkHandleProps) {
  const { startConnect } = useNavigation();
  const size = useHandleSize();

  return (
    <button
      type="button"
      aria-label={`Enlace de ${label}`}
      title={link ? "Clic para editar el enlace, o arrástralo a otra página" : "Arrastra hasta una página para enlazar, o haz clic"}
      onPointerDown={(e) => {
        e.preventDefault(); // evita seleccionar texto mientras se arrastra
        e.stopPropagation(); // y que el bloque se seleccione
        const rect = e.currentTarget.getBoundingClientRect();
        startConnect(element, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }}
      onClick={(e) => e.stopPropagation()}
      className={`absolute -top-2 -right-2 z-20 flex cursor-crosshair touch-none items-center justify-center rounded-full border text-[10px] font-bold shadow ${
        link
          ? "border-sky-500 bg-sky-500 text-white"
          : "hidden border-sky-500 bg-white text-sky-600 group-hover/element:flex focus:flex"
      }`}
      style={size}
    >
      {link ? linkArrow(link) : <LinkIcon />}
    </button>
  );
}
