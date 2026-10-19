"use client";

import { useCommands } from "../commands/commands-context";
import { ChevronIcon, MinusIcon, PlusIcon } from "./icons";
import { MenuButton, type MenuItem } from "./menu-button";
import { iconButton, idle } from "./toolbar-parts";
import { ZOOM_STEPS, useViewport } from "./viewport-context";

const FIT = "fit";

const ZOOM_ITEMS: MenuItem<string>[] = [
  { value: FIT, label: "Ajustar a la ventana" },
  ...ZOOM_STEPS.map((zoom, index) => ({ value: String(zoom), label: `${zoom}%`, dividerBefore: index === 0 })),
];

/** Alejar, el nivel de zoom (con su menú) y acercar. */
export function ZoomControls() {
  const { zoom, setZoom, stepZoom, fitted, fitToWindow } = useViewport();
  const { withShortcut } = useCommands();

  return (
    <>
      <button
        type="button"
        aria-label="Alejar"
        title={withShortcut("Alejar", "zoom.out")}
        onClick={() => stepZoom(-1)}
        disabled={zoom <= ZOOM_STEPS[0]}
        className={`${iconButton} ${idle} disabled:opacity-40`}
      >
        <MinusIcon />
      </button>

      <MenuButton
        label="Nivel de zoom"
        items={ZOOM_ITEMS}
        selected={fitted ? FIT : String(zoom)}
        onSelect={(value) => (value === FIT ? fitToWindow() : setZoom(Number(value)))}
        className="flex h-8 min-w-14 items-center justify-center gap-1 rounded-lg px-1.5 text-xs hover:bg-hover"
      >
        {zoom}%
        <ChevronIcon size={10} />
      </MenuButton>

      <button
        type="button"
        aria-label="Acercar"
        title={withShortcut("Acercar", "zoom.in")}
        onClick={() => stepZoom(1)}
        disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
        className={`${iconButton} ${idle} disabled:opacity-40`}
      >
        <PlusIcon />
      </button>
    </>
  );
}
