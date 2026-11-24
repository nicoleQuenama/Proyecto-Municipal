"use client";

import { useState } from "react";
import { Badge } from "../ui/badge";
import { Collapsible } from "../ui/collapsible";
import { Modal } from "../ui/modal";
import { optimizedSrc } from "../media/optimize-src";
import type { BrandLogoConfig, ProjectMediaAsset, SiteState } from "../site/types";

interface BrandIdentitySectionProps {
  site: SiteState;
  dispatch: (action: any) => void;
  canEdit?: boolean;
}

const DEFAULT_LOGO_URL = "https://ik.imagekit.io/kaofwdmmj/org/01a1c6d4-5cd6-7294-b7d7-7b9fd6600be6/01a1c6da-5c3d-7bc1-ae30-3aef41483a4f/global/db8443d897db-logo-cocha-2026-06.png";
const DEFAULT_ESCUDO_URL = "https://ik.imagekit.io/kaofwdmmj/org/01a1c6d4-5cd6-7294-b7d7-7b9fd6600be6/01a1c6da-5c3d-7bc1-ae30-3aef41483a4f/global/125f6ea17a73-escudo-gamc-vertical.png";

export function BrandIdentitySection({ site, dispatch, canEdit = false }: BrandIdentitySectionProps) {
  const currentLogo: BrandLogoConfig = site.brandLogo ?? {
    src: DEFAULT_LOGO_URL,
    alt: "Logo Oficial Cochabamba 2026",
    width: 140,
    height: 56,
    fit: "contain",
  };

  const currentFavicon = site.brandFavicon ?? currentLogo.src;
  const currentEscudo = site.brandEscudo?.src ?? DEFAULT_ESCUDO_URL;

  // Modales de selección desde biblioteca
  const [pickerTarget, setPickerTarget] = useState<"logo" | "favicon" | "escudo" | null>(null);
  const [pickerFilter, setPickerFilter] = useState<"institucional" | "all">("institucional");

  const mediaList: ProjectMediaAsset[] = site.projectMedia ?? [];
  const filteredMedia = mediaList.filter((m) => {
    if (m.kind !== "image") return false;
    if (pickerFilter === "institucional") {
      return (
        m.tag?.toLowerCase() === "institucional" ||
        m.tags?.some((t) => t.toLowerCase() === "institucional") ||
        m.name.toLowerCase().includes("logo") ||
        m.name.toLowerCase().includes("escudo") ||
        m.name.toLowerCase().includes("cocha")
      );
    }
    return true;
  });

  const handleSelectAsset = (asset: ProjectMediaAsset) => {
    if (pickerTarget === "logo") {
      dispatch({
        type: "brand/identity",
        brandLogo: {
          ...currentLogo,
          src: asset.src,
          alt: asset.name || "Logo Oficial",
        },
      });
    } else if (pickerTarget === "favicon") {
      dispatch({
        type: "brand/identity",
        brandFavicon: asset.src,
      });
    } else if (pickerTarget === "escudo") {
      dispatch({
        type: "brand/identity",
        brandEscudo: {
          src: asset.src,
          alt: asset.name || "Escudo GAMC",
        },
      });
    }
    setPickerTarget(null);
  };

  const updateLogoDimensions = (width: number, height: number, fit?: "contain" | "cover") => {
    dispatch({
      type: "brand/identity",
      brandLogo: {
        ...currentLogo,
        width,
        height,
        ...(fit ? { fit } : {}),
      },
    });
  };

  return (
    <Collapsible
      title="Identidad Institucional · Logos y Favicon"
      defaultOpen={true}
      badge={<Badge tone="accent">Oficial</Badge>}
    >
      <div className="flex flex-col gap-4 rounded-lg border border-line bg-canvas/40 p-3">
        {/* Aviso de permisos */}
        {!canEdit && (
          <p className="rounded-md bg-hover px-2.5 py-1.5 text-[11px] text-ink-dim">
            Solo el superadministrador puede cambiar el logo oficial y el favicon del portal.
          </p>
        )}

        {/* 1. Logo Oficial (Header y Footer) */}
        <div className="flex flex-col gap-2 border-b border-line/60 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">Logo Oficial (Header & Footer)</span>
            <span className="text-[10px] text-ink-dim">Se sincroniza automáticamente</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Vista previa con fondo oscuro para contrastar logos blancos/transparentes */}
            <div className="relative flex h-16 w-36 shrink-0 items-center justify-center rounded-md border border-line bg-slate-900 p-1.5 shadow-inner">
              <img
                src={optimizedSrc(currentLogo.src)}
                alt={currentLogo.alt ?? "Logo Oficial"}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {canEdit && (
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setPickerTarget("logo");
                    setPickerFilter("institucional");
                  }}
                  className="rounded-md border border-line bg-panel px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-hover cursor-pointer"
                >
                  Cambiar logo...
                </button>
                <span className="truncate text-[10px] text-ink-dim" title={currentLogo.src}>
                  {currentLogo.alt || "Logo Cochabamba 2026"}
                </span>
              </div>
            )}
          </div>

          {/* Dimensiones y acomodo del logo */}
          {canEdit && (
            <div className="mt-1 flex flex-col gap-2 rounded-md bg-hover/40 p-2.5 border border-line/40">
              <span className="text-[11px] font-medium text-ink">Dimensiones del logo en cabecera</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
                  <span>Ancho: {currentLogo.width ?? 140} px</span>
                  <input
                    type="range"
                    min="60"
                    max="280"
                    step="4"
                    value={currentLogo.width ?? 140}
                    onChange={(e) => updateLogoDimensions(Number(e.target.value), currentLogo.height ?? 56)}
                    className="accent-accent cursor-pointer"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
                  <span>Alto: {currentLogo.height ?? 56} px</span>
                  <input
                    type="range"
                    min="24"
                    max="100"
                    step="2"
                    value={currentLogo.height ?? 56}
                    onChange={(e) => updateLogoDimensions(currentLogo.width ?? 140, Number(e.target.value))}
                    className="accent-accent cursor-pointer"
                  />
                </label>
              </div>
              <div className="flex items-center justify-between text-[11px] text-ink-dim pt-1 border-t border-line/30">
                <span>Ajuste en caja:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateLogoDimensions(currentLogo.width ?? 140, currentLogo.height ?? 56, "contain")}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer ${
                      (currentLogo.fit ?? "contain") === "contain"
                        ? "bg-accent text-white"
                        : "bg-panel text-ink hover:bg-hover border border-line"
                    }`}
                  >
                    Proporcional
                  </button>
                  <button
                    type="button"
                    onClick={() => updateLogoDimensions(currentLogo.width ?? 140, currentLogo.height ?? 56, "cover")}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer ${
                      currentLogo.fit === "cover"
                        ? "bg-accent text-white"
                        : "bg-panel text-ink hover:bg-hover border border-line"
                    }`}
                  >
                    Llenar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Favicon de la Web */}
        <div className="flex flex-col gap-2 border-b border-line/60 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">Favicon de la Web</span>
            <span className="text-[10px] text-ink-dim">Icono de la pestaña del navegador</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Simulación pestaña de navegador */}
            <div className="flex items-center gap-2 rounded-t-md border border-b-0 border-line bg-panel px-3 py-1.5 shadow-xs">
              <div className="flex size-5 items-center justify-center overflow-hidden rounded-xs bg-slate-900 p-0.5">
                <img
                  src={optimizedSrc(currentFavicon)}
                  alt="Favicon"
                  className="size-full object-contain"
                />
              </div>
              <span className="text-[11px] font-medium text-ink-dim max-w-[90px] truncate">
                GAMC Cochabamba
              </span>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setPickerTarget("favicon");
                  setPickerFilter("institucional");
                }}
                className="rounded-md border border-line bg-panel px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-hover cursor-pointer"
              >
                Cambiar favicon...
              </button>
            )}
          </div>
        </div>

        {/* 3. Escudo Municipal GAMC */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">Escudo Oficial (GAMC)</span>
            <span className="text-[10px] text-ink-dim">Símbolo patrio institucional</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-line bg-slate-900 p-1">
              <img
                src={optimizedSrc(currentEscudo)}
                alt="Escudo Oficial GAMC"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setPickerTarget("escudo");
                  setPickerFilter("institucional");
                }}
                className="rounded-md border border-line bg-panel px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-hover cursor-pointer"
              >
                Cambiar escudo...
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal para seleccionar imagen de la biblioteca */}
      {pickerTarget && (
        <Modal
          title={
            pickerTarget === "logo"
              ? "Seleccionar Logo Oficial"
              : pickerTarget === "favicon"
                ? "Seleccionar Favicon"
                : "Seleccionar Escudo Oficial"
          }
          open={true}
          onClose={() => setPickerTarget(null)}
        >
          <div className="flex flex-col gap-3 min-w-[320px] max-w-md">
            {/* Filtros de biblioteca */}
            <div className="flex gap-2 border-b border-line pb-2">
              <button
                type="button"
                onClick={() => setPickerFilter("institucional")}
                className={`px-2.5 py-1 text-xs rounded-full font-medium cursor-pointer ${
                  pickerFilter === "institucional"
                    ? "bg-accent text-white"
                    : "bg-hover text-ink-dim hover:text-ink"
                }`}
              >
                Institucional
              </button>
              <button
                type="button"
                onClick={() => setPickerFilter("all")}
                className={`px-2.5 py-1 text-xs rounded-full font-medium cursor-pointer ${
                  pickerFilter === "all"
                    ? "bg-accent text-white"
                    : "bg-hover text-ink-dim hover:text-ink"
                }`}
              >
                Todos los medios ({mediaList.length})
              </button>
            </div>

            {/* Cuadrícula de selección */}
            <div className="grid grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1">
              {filteredMedia.length === 0 ? (
                <p className="col-span-3 py-6 text-center text-xs text-ink-dim">
                  No se encontraron imágenes con este filtro.
                </p>
              ) : (
                filteredMedia.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => handleSelectAsset(asset)}
                    className="group flex flex-col items-center gap-1.5 rounded-lg border border-line p-2 hover:border-accent hover:bg-hover/50 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex size-16 items-center justify-center rounded-md bg-slate-900 p-1">
                      <img
                        src={optimizedSrc(asset.src)}
                        alt={asset.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <span className="w-full truncate text-[10px] text-ink text-center group-hover:text-accent" title={asset.name}>
                      {asset.name}
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => setPickerTarget(null)}
                className="rounded-md border border-line px-3 py-1.5 text-xs text-ink hover:bg-hover cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Collapsible>
  );
}
