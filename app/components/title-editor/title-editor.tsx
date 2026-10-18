"use client";

import { useNavigation } from "../navigation/navigation-context";
import { HiddenPlaceholder } from "../site/hidden-placeholder";
import { VisibilityEye } from "../site/visibility-eye";
import { useCurrentPage, useSiteDispatch } from "../site/site-context";
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

  return (
    <Toolbar state={effective} onChange={onChange} onReset={() => dispatch({ type: "title/reset" })} />
  );
}

interface TitleCanvasProps {
  page: Page;
  /** Solo el titular de la página que se está editando se puede escribir. */
  interactive: boolean;
}

/** El titular de una página, tal como se ve en el lienzo. */
export function TitleCanvas({ page, interactive }: TitleCanvasProps) {
  const effective = useEffectiveTitle(page);
  const dispatch = useSiteDispatch();
  const { mode } = useNavigation();
  // Al conectar o probar, o en una página que no es la actual, no se escribe en el titular.
  const shown = interactive && mode === "edit" ? effective : { ...effective, editing: false };
  const setHidden = (hidden: boolean) =>
    dispatch({ type: "hidden/set", target: { kind: "title", pageId: page.id }, hidden });

  // Oculto: no se ve. Al editar queda un ojo en su lugar para volver a mostrarlo.
  if (page.titleHidden) {
    return mode === "edit" ? <HiddenPlaceholder label="Titular oculto" onShow={() => setHidden(false)} /> : null;
  }

  return (
    <div className="group relative" style={effective.applyToSite ? { fontFamily: effective.font } : undefined}>
      {/* key: al cambiar de página el titular se vuelve a montar con su texto. */}
      <TitlePreview
        key={page.id}
        state={shown}
        onTextChange={(text) => interactive && dispatch({ type: "title/patch", patch: { text } })}
      />
      {mode === "edit" && (
        <VisibilityEye
          hidden={false}
          label="el titular"
          onToggle={() => setHidden(true)}
          className="absolute top-1 right-1 hidden group-hover:flex focus:flex"
        />
      )}
    </div>
  );
}
