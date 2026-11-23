"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { CanvasElement } from "../site/types";
import { submitForm } from "./submit";
import { useSite, useSiteDispatch } from "../site/site-context";
import { useNavigation } from "../navigation/navigation-context";
import { searchMunicipalContent, type MunicipalSearchHit } from "../search/search-engine";

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
      <button className="cursor-pointer"
        type="button"
        tabIndex={live ? 0 : -1}
        style={{ ...look(element, false), ...idle, textAlign: "center", cursor: "pointer" }}
        onClick={
          live
            ? (e) => {
                if (isSearchTrigger) {
                  const formOrBlock = e.currentTarget.closest("[data-block-id]") || e.currentTarget.closest("form") || document;
                  const searchInput = formOrBlock.querySelector<HTMLInputElement>("input[type='search'], input[name='search-query']");
                  const isGeneric = element.text.toLowerCase().includes("buscar") || element.text.trim() === "⌕";
                  const query = (!isGeneric && element.text.trim().length > 0)
                    ? element.text.trim()
                    : (searchInput?.value ?? "");
                  if (!isGeneric && searchInput) {
                    searchInput.value = element.text.trim();
                  }
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
  if (spec.inputType === "radio") {
    return <RadioGroupControl spec={spec} wrapper={wrapper} idle={idle} />;
  }
  if (spec.inputType === "search" || spec.name === "search-query" || (spec.placeholder && spec.placeholder.toLowerCase().includes("buscar"))) {
    return <SearchInputControl element={element} spec={spec} live={live} wrapper={wrapper} />;
  }
  return (
    <div {...wrapper}>
      <input type={spec.inputType ?? "text"} name={spec.name} placeholder={spec.placeholder} tabIndex={live ? 0 : -1} style={look(element, true)} />
    </div>
  );
}

function SearchInputControl({
  element,
  spec,
  live,
  wrapper,
}: {
  element: CanvasElement;
  spec: NonNullable<CanvasElement["control"]>;
  live: boolean;
  wrapper: Record<string, unknown>;
}) {
  const site = useSite();
  const dispatch = useSiteDispatch();
  const navigation = useNavigation();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const rawHits = live ? searchMunicipalContent(site, query) : [];
  const hits = rawHits.slice(0, 5);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectHit = (hit: MunicipalSearchHit) => {
    setIsOpen(false);
    if (hit.pageId) {
      dispatch({ type: "page/select", id: hit.pageId });
      navigation.followLink({ kind: "page", pageId: hit.pageId });
      if (hit.blockId) {
        setTimeout(() => {
          const target = document.querySelector(`[data-block-id="${hit.blockId}"]`) || document.querySelector(`[data-target*="${hit.blockId}"]`);
          target?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 120);
      }
    } else {
      window.dispatchEvent(new CustomEvent("cms:open-search", { detail: { query: hit.title } }));
    }
  };

  return (
    <div
      {...wrapper}
      ref={containerRef}
      style={{
        ...((wrapper.style as CSSProperties) || {}),
        position: "relative",
      }}
    >
      <input
        type="search"
        name={spec.name}
        placeholder={spec.placeholder || "Buscar trámites o servicios..."}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
        }}
        tabIndex={live ? 0 : -1}
        style={look(element, true)}
        onKeyDown={
          live
            ? (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setIsOpen(false);
                  window.dispatchEvent(new CustomEvent("cms:open-search", { detail: { query } }));
                } else if (e.key === "Escape") {
                  setIsOpen(false);
                }
              }
            : undefined
        }
      />
      {live && isOpen && hits.length > 0 && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#ffffff",
            color: "#1e293b",
            borderRadius: 8,
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.25), 0 8px 10px -6px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
            zIndex: 9999,
            maxHeight: 320,
            overflowY: "auto",
            padding: "6px 0",
            textAlign: "left",
          }}
        >
          {hits.map((hit) => (
            <button
              key={hit.id}
              type="button"
              onClick={() => handleSelectHit(hit)}
              style={{
                display: "block",
                width: "100%",
                padding: "8px 14px",
                textAlign: "left",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                borderBottom: "1px solid #f1f5f9",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: "var(--color-primario, #0c4a6e)" }}>
                  {hit.title}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: "#e0f2fe",
                    color: "#0369a1",
                    whiteSpace: "nowrap",
                  }}
                >
                  {hit.category}
                </span>
              </div>
              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: 11,
                  color: "#64748b",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {hit.description}
              </p>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              window.dispatchEvent(new CustomEvent("cms:open-search", { detail: { query } }));
            }}
            style={{
              display: "block",
              width: "100%",
              padding: "10px 14px",
              textAlign: "center",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--color-celeste-oscuro, #0284c7)",
              background: "#f0f9ff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Ver todos los resultados en el buscador modal &rarr;
          </button>
        </div>
      )}
    </div>
  );
}

function RadioGroupControl({
  spec,
  wrapper,
  idle,
}: {
  spec: NonNullable<CanvasElement["control"]>;
  wrapper: Record<string, unknown>;
  idle: CSSProperties;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleOptionSelected = (e: Event) => {
      const detail = (e as CustomEvent<{ index?: number; optionKey?: string }>).detail;
      if (typeof detail?.index === "number" && detail.index >= 0 && detail.index < (spec.options?.length ?? 0)) {
        setSelectedIndex(detail.index);
      } else if (detail?.optionKey) {
        const match = detail.optionKey.match(/opt(\d+)/);
        if (match) {
          const idx = parseInt(match[1], 10) - 1;
          if (idx >= 0 && idx < (spec.options?.length ?? 0)) {
            setSelectedIndex(idx);
          }
        }
      }
    };
    window.addEventListener("cms:option-selected", handleOptionSelected);
    return () => window.removeEventListener("cms:option-selected", handleOptionSelected);
  }, [spec.options?.length]);

  return (
    <div
      {...wrapper}
      role="radiogroup"
      aria-label={spec.name || "Opciones"}
      className="flex flex-wrap items-center gap-1.5 sm:gap-2 max-w-full"
      style={{
        ...idle,
        pointerEvents: "auto",
        height: "auto",
        minHeight: "100%",
        width: "100%",
        maxWidth: "100%",
      }}
    >
      {(spec.options ?? []).map((option, index) => {
        const isChecked = selectedIndex === index;
        return (
          <label key={option} className="cursor-pointer max-w-full">
            <input
              type="radio"
              name={spec.name}
              value={option}
              checked={isChecked}
              tabIndex={0}
              className="peer sr-only cursor-pointer"
              onChange={(e) => {
                setSelectedIndex(index);
                const optKey = `opt${index + 1}`;
                const section = e.currentTarget.closest("section") || e.currentTarget.closest("[data-block-id]") || e.currentTarget.closest("[data-component]");
                if (section) {
                  section.setAttribute("data-active-option", optKey);
                  const canvasEl = section.querySelector("[data-canvas]");
                  if (canvasEl) canvasEl.setAttribute("data-active-option", optKey);
                }
                window.dispatchEvent(
                  new CustomEvent("cms:option-selected", {
                    detail: { optionKey: optKey, index, option },
                  }),
                );
              }}
            />
            <span
              className={`inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-accent max-w-full truncate ${
                isChecked
                  ? "border-sky-700 bg-sky-700 text-white font-semibold shadow-xs"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              {option}
            </span>
          </label>
        );
      })}
    </div>
  );
}


