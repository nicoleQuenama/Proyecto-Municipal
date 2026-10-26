"use client";

import type { ReactNode } from "react";
import type { ComponentDef } from "../site/types";
import { FoldAccordion } from "./fold-accordion-view";
import { FoldMore } from "./fold-more";
import { useFlag } from "./flag-store";
import type { FoldConfig, FoldKind } from "./types";

type Render = (view: ComponentDef, overlay?: ReactNode) => ReactNode;

interface FoldedViewProps {
  fold: FoldConfig | undefined;
  view: ComponentDef;
  blockId: string;
  /** Se está editando: el recorte y el plegado se ven solo si la persona lo pide («Ver el resultado»). */
  editing: boolean;
  background?: string;
  /** Dibuja la sección (con una capa extra encima, si la hay). */
  render: Render;
}

interface ViewProps<K extends FoldKind> {
  fold: Extract<FoldConfig, { kind: K }>;
  view: ComponentDef;
  background?: string;
  active: boolean;
  render: Render;
}

/** Cómo se presenta cada tipo. El carrusel lo dibuja la lista repetida; aquí la sección va tal cual. */
const FOLD_VIEWS: { [K in FoldKind]: (props: ViewProps<K>) => ReactNode } = {
  carousel: ({ view, render }) => render(view),
  more: ({ fold, view, background, active, render }) => (
    <FoldMore fold={fold} height={view.height} background={background} active={active}>
      {render(view)}
    </FoldMore>
  ),
  accordion: ({ fold, view, active, render }) => (
    <FoldAccordion key={String(fold.open)} fold={fold} view={view} active={active} render={render} />
  ),
};

/** La sección con su presentación para pantallas pequeñas (recorte, acordeón…) alrededor. */
export function FoldedView({ fold, view, blockId, editing, background, render }: FoldedViewProps) {
  const [peek] = useFlag(`fold:${blockId}`);
  if (!fold) return <>{render(view)}</>;
  // TypeScript no relaciona el tipo con su entrada de la tabla; `FOLD_VIEWS` lo garantiza.
  const draw = FOLD_VIEWS[fold.kind] as (props: ViewProps<FoldKind>) => ReactNode;
  return <>{draw({ fold, view, background, active: !editing || peek, render })}</>;
}
