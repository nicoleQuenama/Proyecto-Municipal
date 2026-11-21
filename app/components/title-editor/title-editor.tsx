"use client";

import { useNavigation } from "../navigation/navigation-context";
import { PlacementGrip } from "../placement/placement-grip";
import { placementAttributes, placementStyle } from "../placement/placement-style";
import { isAdaptive } from "../responsive/devices";
import { useDevicePlacement } from "../responsive/use-device-placement";
import { useViewport } from "../viewport/viewport-context";
import { usePlacementDrag } from "../placement/use-placement-drag";
import { useWidthResize } from "../placement/use-width-resize";
import { WidthHandles } from "../placement/width-handles";
import { HiddenPlaceholder } from "../site/hidden-placeholder";
import { VisibilityEye } from "../site/visibility-eye";
import { useCurrentPage, useSiteDispatch } from "../site/site-context";
import type { Placement } from "../placement/types";
import type { Page } from "../site/types";
import { TITLE_STYLE_KEYS, titleWithRules } from "../styles/apply";
import { useStyles } from "../styles/use-styles";
import { TitlePreview } from "./title-preview";
import { Toolbar } from "./toolbar";
import type { TitleState } from "./types";

/** El titular de una página tal como se ve: si sigue los estilos del sitio, mandan las reglas de «Títulos». */
function useEffectiveTitle(page: Page): TitleState {
  const { role } = useStyles(page.id);
  return titleWithRules(page.title, role("heading"));
}

/** Barra de formato del titular de la página actual. */
export function TitleToolbar() {
  const page = useCurrentPage();
  const { title } = page;
  const effective = useEffectiveTitle(page);
  const dispatch = useSiteDispatch();

  const onChange = (patch: Partial<TitleState>) => {
    // Si una regla manda sobre lo que se está tocando, editarlo a mano desvincula el titular
    // de los estilos del sitio, conservando lo que se veía para que no «salte».
    const overridesRule = TITLE_STYLE_KEYS.some((key) => key in patch && effective[key] !== title[key]);

    if (title.applyToSite && overridesRule && !("applyToSite" in patch)) {
      const visible = Object.fromEntries(TITLE_STYLE_KEYS.map((key) => [key, effective[key]]));
      dispatch({ type: "title/patch", patch: { ...visible, ...patch, applyToSite: false } });
    } else {
      dispatch({ type: "title/patch", patch });
    }
  };

  if (page.titleRemoved) {
    return (
      <div className="flex min-h-12 min-w-0 flex-1 items-center gap-3 px-3 text-xs text-ink-dim">
        Esta página no tiene titular.
        <button
          type="button"
          onClick={() => dispatch({ type: "title/removed", pageId: page.id, removed: false })}
          className="h-7 rounded-md border border-line px-3 text-ink hover:bg-hover cursor-pointer"
        >
          Añadir titular
        </button>
      </div>
    );
  }

  return (
    <Toolbar
      caption="titular"
      state={effective}
      onChange={onChange}
      onReset={() => dispatch({ type: "title/reset" })}
      onRemoveTitle={() => dispatch({ type: "title/removed", pageId: page.id, removed: true })}
    />
  );
}

interface TitleCanvasProps {
  page: Page;
  /** Solo el titular de la página que se está editando se puede escribir. */
  interactive: boolean;
}

/** El titular de una página: desactivado ya que no se utiliza en el diseño limpio del CMS. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function TitleCanvas({ page, interactive }: TitleCanvasProps) {
  return null;
}
