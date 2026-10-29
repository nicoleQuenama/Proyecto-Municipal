"use client";

import type { CSSProperties } from "react";
import type { CanvasElement } from "../site/types";
import { submitForm } from "./submit";

/** Lo que comparten todos los controles: el aspecto es el del elemento (relleno, esquinas, tipografía). */
const look = (element: CanvasElement, bordered: boolean): CSSProperties => ({
  width: "100%",
  height: "100%",
  boxSizing: "border-box",
  background: element.fill,
  color: element.color,
  fontSize: element.fontSize,
  fontFamily: element.fontFamily || undefined,
  fontWeight: element.bold ? 700 : 400,
  borderRadius: element.radius,
  textAlign: element.align,
  border: bordered ? "1px solid currentColor" : "none",
  padding: bordered ? "0 12px" : 0,
  opacity: 1,
});

/**
 * Un elemento con rol de campo o botón, como HTML de verdad al probar el sitio. Al editar es solo su imagen: el
 * contenedor del elemento recibe los clics para seleccionarlo y moverlo.
 */
export function ControlContent({ element, live, hasClick }: { element: CanvasElement; live: boolean; hasClick: boolean }) {
  const spec = element.control!;
  const idle: CSSProperties = live ? {} : { pointerEvents: "none" };
  const wrapper = { "data-control": spec.name || undefined, "data-required": String(!!spec.required), className: "h-full w-full", style: idle } as const;

  if (spec.kind === "button" || spec.kind === "submit") {
    const isSearchTrigger =
      spec.name === "search-trigger" ||
      element.id.toLowerCase().includes("search") ||
      element.text.toLowerCase().includes("buscar");

    return (
      <button
        type="button"
        tabIndex={live ? 0 : -1}
        style={{ ...look(element, false), ...idle, textAlign: "center", cursor: "pointer" }}
        onClick={
          live
            ? (e) => {
                if (isSearchTrigger) {
                  const formOrBlock = e.currentTarget.closest("[data-block-id]") || e.currentTarget.closest("form") || document;
                  const searchInput = formOrBlock.querySelector<HTMLInputElement>("input[type='search'], input[name='search-query']");
                  const query = searchInput?.value ?? "";
                  window.dispatchEvent(new CustomEvent("cms:open-search", { detail: { query } }));
                  return;
                }
                if (spec.kind === "submit" && !hasClick) {
                  void submitForm(e.currentTarget, "", "¡Enviado!");
                }
              }
            : undefined
        }
      >
        {element.text}
      </button>
    );
  }
  if (spec.kind === "checkbox") {
    return (
      <label {...wrapper} style={{ ...idle, display: "flex", alignItems: "center", gap: 8, color: element.color, fontSize: element.fontSize }}>
        <input type="checkbox" name={spec.name} tabIndex={live ? 0 : -1} style={{ width: element.fontSize, height: element.fontSize }} />
        {element.text}
      </label>
    );
  }
  if (spec.kind === "textarea") {
    return (
      <div {...wrapper}>
        <textarea name={spec.name} placeholder={spec.placeholder} tabIndex={live ? 0 : -1} style={{ ...look(element, true), padding: 12, resize: "none" }} />
      </div>
    );
  }
  if (spec.kind === "select") {
    return (
      <div {...wrapper}>
        <select name={spec.name} tabIndex={live ? 0 : -1} style={look(element, true)}>
          {(spec.options ?? []).map((option) => (
            <option key={option} value={option} style={{ color: "#111827" }}>{option}</option>
          ))}
        </select>
      </div>
    );
  }
  if (spec.inputType === "search" || spec.name === "search-query" || (spec.placeholder && spec.placeholder.toLowerCase().includes("buscar"))) {
    return (
      <div {...wrapper}>
        <input
          type="search"
          name={spec.name}
          placeholder={spec.placeholder || "Buscar trámites o servicios..."}
          tabIndex={live ? 0 : -1}
          style={look(element, true)}
          onKeyDown={
            live
              ? (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent("cms:open-search", { detail: { query: e.currentTarget.value } }));
                  }
                }
              : undefined
          }
        />
      </div>
    );
  }
  return (
    <div {...wrapper}>
      <input type={spec.inputType ?? "text"} name={spec.name} placeholder={spec.placeholder} tabIndex={live ? 0 : -1} style={look(element, true)} />
    </div>
  );
}
