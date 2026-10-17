"use client";

import { useCallback } from "react";
import { useSite } from "../site/site-context";
import { CANVAS_SURFACE_ID, fitZoom } from "./fit-zoom";
import { DEVICES, useViewport, ZOOM_STEPS } from "./viewport-context";

/** Alterna entre ver una página y verlas todas lado a lado, con el zoom que hace que quepan. */
export function useAllPages() {
  const { layout, setLayout, setZoom, device } = useViewport();
  const { pages } = useSite();

  const toggle = useCallback(() => {
    if (layout === "all") return setLayout("single");

    const pageWidth = DEVICES.find((d) => d.value === device)?.width ?? 1024;
    const available = document.getElementById(CANVAS_SURFACE_ID)?.clientWidth ?? 0;

    setLayout("all");
    if (available > 0) setZoom(fitZoom(pages.length, pageWidth, available, ZOOM_STEPS));
  }, [layout, setLayout, setZoom, device, pages.length]);

  return { isAll: layout === "all", toggle };
}
