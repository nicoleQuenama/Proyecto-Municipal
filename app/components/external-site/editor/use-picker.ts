"use client";

import { useEffect, type RefObject } from "react";
import { labelOf, selectorOf } from "../selector";
import { FRAME_CSS } from "./frame-style";
import type { PickedElement } from "./use-patch-editing";

/**
 * Convierte la página dentro del iframe en un selector: el ratón resalta, el clic elige (sin seguir enlaces
 * ni enviar formularios). Los eventos se escuchan en el documento, que es del mismo origen (srcDoc).
 */
export function usePicker(
  frame: RefObject<HTMLIFrameElement | null>,
  loads: number,
  path: string,
  onPick: (picked: PickedElement) => void,
) {
  useEffect(() => {
    const doc = frame.current?.contentDocument;
    if (loads === 0 || !doc) return;

    if (!doc.getElementById("cms-editor-css")) {
      const style = doc.createElement("style");
      style.id = "cms-editor-css";
      style.textContent = FRAME_CSS;
      doc.head.appendChild(style);
    }

    const mark = (attribute: string, el: Element | null) => {
      doc.querySelectorAll(`[${attribute}]`).forEach((node) => node.removeAttribute(attribute));
      el?.setAttribute(attribute, "");
    };
    const over = (e: Event) => mark("data-cms-hover", e.target as Element);
    const leave = () => mark("data-cms-hover", null);
    const click = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const el = e.target as Element;
      mark("data-cms-hover", null);
      mark("data-cms-picked", el);
      onPick({ el, selector: selectorOf(el), label: labelOf(el), path });
    };

    doc.addEventListener("mouseover", over);
    doc.addEventListener("mouseleave", leave);
    doc.addEventListener("click", click, true);
    return () => {
      doc.removeEventListener("mouseover", over);
      doc.removeEventListener("mouseleave", leave);
      doc.removeEventListener("click", click, true);
    };
  }, [frame, loads, path, onPick]);
}
