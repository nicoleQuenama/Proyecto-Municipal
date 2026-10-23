"use client";

import { NavigationProvider } from "../navigation/navigation-context";
import { useSite } from "../site/site-context";
import { PageArtboard } from "../viewport/artboard";
import { DEVICES, useViewport } from "../viewport/viewport-context";
import { useFitWidth } from "./use-fit-width";

/**
 * La página con lo que se está escribiendo, en vivo y como la verá el visitante («Probar»): el CSS, el HTML de
 * una sección y el código TypeScript de la página o de una interacción se ven aquí al guardarse solos.
 */
export function SitePreview({ pageId }: { pageId: string | null }) {
  const { pages, currentPageId } = useSite();
  const { device } = useViewport();
  const page = pages.find((p) => p.id === (pageId ?? currentPageId)) ?? pages[0];
  const width = DEVICES.find((d) => d.value === device)!.width;
  const { ref, scale } = useFitWidth(width);

  return (
    <aside aria-label="Vista previa de la página" className="flex w-[42%] min-w-80 shrink-0 flex-col border-l border-line bg-neutral-200">
      <p className="flex items-center gap-2 border-b border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-600">
        <span aria-hidden className="h-2 w-2 rounded-full bg-emerald-500" />
        Vista previa en vivo · {page.name}
      </p>
      <div ref={ref} className="min-h-0 flex-1 overflow-auto p-2">
        {/* Una página nueva vuelve a montarse; `zoom` encoge el diseño para que quepa a lo ancho. */}
        <div key={page.id} style={{ zoom: scale }}>
          <NavigationProvider initialMode="preview">
            <PageArtboard page={page} active tiled={false} />
          </NavigationProvider>
        </div>
      </div>
    </aside>
  );
}
