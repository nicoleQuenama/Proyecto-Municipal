"use client";

import { MediaList } from "../media/media-list";
import { PageGuidesProvider } from "../placement/page-guides";
import { PageBlocks } from "../site/page-blocks";
import type { Page } from "../site/types";
import { boxStyle } from "../styles/apply";
import { useStyles } from "../styles/use-styles";
import { TitleCanvas } from "../title-editor/title-editor";

/** El contenido de una página (titular, secciones y medios) para mostrarlo dentro de una ventana. */
export function ModalPage({ page }: { page: Page }) {
  const styles = useStyles(page.id);

  return (
    <PageGuidesProvider>
      <div data-modal-page className="relative min-h-full bg-white px-10 py-12 text-neutral-900" style={boxStyle(styles.page)}>
        <PageBlocks page={page} interactive={false} slot="top" />
        <TitleCanvas page={page} interactive={false} />
        <PageBlocks page={page} interactive={false} slot="body" />
        <MediaList page={page} interactive={false} />
      </div>
    </PageGuidesProvider>
  );
}
