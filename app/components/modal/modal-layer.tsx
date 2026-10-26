"use client";

import { ParamsContext } from "../dynamic/params-context";
import { useNavigation } from "../navigation/navigation-context";
import { useSite } from "../site/site-context";
import { ModalPage } from "./modal-page";
import { ModalView } from "./modal-view";
import { PreviewScope } from "./preview-scope";

/** La ventana modal abierta por un enlace: muestra la página de destino con sus parámetros y sus datos. */
export function ModalLayer() {
  const { modal, closeModal } = useNavigation();
  const { pages } = useSite();
  const page = modal ? pages.find((p) => p.id === modal.pageId) : undefined;
  if (!modal || !page) return null;

  return (
    <PreviewScope>
      <ParamsContext value={modal.values}>
        <ModalView key={`${page.id}:${JSON.stringify(modal.values)}`} label={page.name} options={modal.options} onClose={closeModal}>
          <ModalPage page={page} />
        </ModalView>
      </ParamsContext>
    </PreviewScope>
  );
}
