"use client";

import { useMemo, useState } from "react";
import { useAuth } from "../auth/auth-context";
import {
  BRAND_BORDER_PRESETS,
  BRAND_BUTTON_PRESETS,
  BRAND_SURFACE_COLORS,
  BRAND_TEXT_COLORS,
  GAMC_BRAND_TOKENS,
  isRestrictedByBrand,
  type BorderPresetId,
} from "../auth/brand-manual";
import { LockClosedIcon, LockOpenIcon } from "../icons/lock-icons";
import { CATEGORY_LABELS, styleTarget } from "../site/categories";
import { useSite, useSiteDispatch } from "../site/site-context";
import type { BlockInstance, CanvasElement, ComponentDef, ElementOverride } from "../site/types";
import { computeStyle, isPropLockedBySuperAdmin } from "../styles/resolve";
import type { BlockTarget, StyleProp, StyleRule, StyleScope, StyleTarget } from "../styles/types";

export type GovernanceLevel = "global" | "category" | "individual";

interface BrandGovernanceControlsProps {
  pageId: string;
  block: BlockInstance;
  def: ComponentDef;
  element?: CanvasElement;
  onApplyElementColor?: (patch: ElementOverride) => void;
}

/**
 * Sistema Centralizado de Identidad Visual y Gobernanza de Estilos para Super Admin.
 * Permite gobernar estilos en 3 niveles (Global, Categoría, Individual),
 * aplicar el sistema centralizado de bordes, e imponer reglas obligatorias.
 */
export function BrandGovernanceControls({
  pageId,
  block,
  def,
  element,
  onApplyElementColor,
}: BrandGovernanceControlsProps) {
  const { variables, rules } = useSite();
  const dispatch = useSiteDispatch();
  const { currentUser } = useAuth();

  const isSuperAdmin = currentUser?.role === "superadmin" || !isRestrictedByBrand(currentUser);
  const targetCategory: BlockTarget = styleTarget(def.category);

  // Nivel activo en el inspector de gobernanza
  const [activeLevel, setActiveLevel] = useState<GovernanceLevel>("individual");

  // Reglas vigentes de estilo
  const stylesState = useMemo(() => ({ variables, rules }), [variables, rules]);
  const pageCtx = useMemo(
    () => ({ pageId, componentId: def.id, componentCategory: targetCategory }),
    [pageId, def.id, targetCategory],
  );

  // Regla global y regla de categoría existentes
  const globalRule = useMemo(
    () => rules.find((r) => r.scope.kind === "global" && r.target === targetCategory),
    [rules, targetCategory],
  );

  const containerRule = useMemo(
    () => rules.find((r) => r.scope.kind === "global" && r.target === "container"),
    [rules],
  );

  // Estilo resuelto para la categoría y para el contenedor
  const categoryStyle = useMemo(
    () => computeStyle(stylesState, pageCtx, targetCategory),
    [stylesState, pageCtx, targetCategory],
  );

  const containerStyle = useMemo(
    () => computeStyle(stylesState, pageCtx, "container"),
    [stylesState, pageCtx],
  );

  // Comprobar si la categoría tiene regla obligatoria impuesta por Super Admin
  const isCategoryMandatory = Boolean(globalRule?.mandatory);

  // Elemento efectivo o raíz de tarjeta
  const isContainerElement = element?.role === "container" || (!element && def.category === "cards");
  const isButtonElement = element?.role === "button" || element?.control?.kind === "button";

  // Identificar el preset de borde actual
  const currentBorderWidth = element?.borderWidth ?? (categoryStyle.borderWidth ? parseInt(categoryStyle.borderWidth, 10) : 0);
  const currentBorderColor = (element?.borderColor ?? categoryStyle.borderColor ?? "#E2E8F0").toLowerCase();
  const currentBorderStyle = element?.borderStyle ?? (categoryStyle.borderStyle as any) ?? "solid";
  const currentRadius = element?.radius ?? (categoryStyle.radius ? parseInt(categoryStyle.radius, 10) : 12);

  const activeBorderPreset: BorderPresetId = useMemo(() => {
    if (element?.borderPreset) return element.borderPreset;
    if (currentBorderWidth === 0 || currentBorderStyle === "none") return "none";
    if (currentBorderWidth === 2 && currentBorderColor === "#00a7d6") return "primary";
    if (currentBorderWidth === 1 && currentBorderColor === "#e2e8f0") return "secondary";
    return "custom";
  }, [element?.borderPreset, currentBorderWidth, currentBorderColor, currentBorderStyle]);

  // Verificar si propiedades clave están bloqueadas por Super Admin
  const isFillLocked = isPropLockedBySuperAdmin(stylesState, targetCategory, "fill") || isPropLockedBySuperAdmin(stylesState, targetCategory, "background") || isCategoryMandatory;
  const isBorderLocked = isPropLockedBySuperAdmin(stylesState, targetCategory, "borderWidth") || isCategoryMandatory;
  const isRadiusLocked = isPropLockedBySuperAdmin(stylesState, targetCategory, "radius") || isCategoryMandatory;

  // Estado de gobernanza de una propiedad ("inherited" | "custom" | "locked")
  const getPropStatus = (prop: StyleProp, hasDirectOverride: boolean): "inherited" | "custom" | "locked" => {
    if (isCategoryMandatory || isPropLockedBySuperAdmin(stylesState, targetCategory, prop)) {
      return "locked";
    }
    if (hasDirectOverride) return "custom";
    return "inherited";
  };

  const fillStatus = getPropStatus("fill", Boolean(element?.fill));
  const borderStatus = getPropStatus("borderWidth", Boolean(element?.borderWidth !== undefined));

  // Aplicar Preset de Borde
  const handleSelectBorderPreset = (presetId: BorderPresetId) => {
    if (!isSuperAdmin && isBorderLocked) return;

    if (activeLevel === "category" && isSuperAdmin) {
      // Guardar regla de borde para toda la categoría
      const preset = presetId !== "custom" ? BRAND_BORDER_PRESETS[presetId] : null;
      const targetScope: StyleScope = { kind: "global" };
      const currentProps = globalRule?.props ?? {};
      const newProps = {
        ...currentProps,
        borderWidth: preset ? preset.width : "1px",
        borderColor: preset ? preset.color : "#E2E8F0",
        borderStyle: preset ? preset.style : "solid",
        radius: preset ? preset.radius : "12px",
      };
      const updatedRule: StyleRule = {
        scope: targetScope,
        target: targetCategory,
        props: newProps,
        mandatory: globalRule?.mandatory ?? false,
        lockedProps: globalRule?.lockedProps ?? ["borderWidth", "borderColor", "radius"],
      };
      dispatch({ type: "rule/save", rule: updatedRule });
      return;
    }

    if (presetId === "none") {
      const patch: ElementOverride = {
        borderWidth: 0,
        borderColor: "transparent",
        borderStyle: "none",
        borderPreset: "none",
      };
      if (element && onApplyElementColor) onApplyElementColor(patch);
      return;
    }

    if (presetId === "primary") {
      const preset = BRAND_BORDER_PRESETS.primary;
      const patch: ElementOverride = {
        borderWidth: preset.widthPx,
        borderColor: preset.color,
        borderStyle: preset.style,
        radius: preset.radiusPx,
        borderPreset: "primary",
      };
      if (element && onApplyElementColor) onApplyElementColor(patch);
      return;
    }

    if (presetId === "secondary") {
      const preset = BRAND_BORDER_PRESETS.secondary;
      const patch: ElementOverride = {
        borderWidth: preset.widthPx,
        borderColor: preset.color,
        borderStyle: preset.style,
        radius: preset.radiusPx,
        borderPreset: "secondary",
      };
      if (element && onApplyElementColor) onApplyElementColor(patch);
      return;
    }

    // Custom: conservar o iniciar con valores sutiles
    const patch: ElementOverride = {
      borderWidth: currentBorderWidth > 0 ? currentBorderWidth : 1,
      borderColor: currentBorderColor !== "transparent" ? currentBorderColor : "#E2E8F0",
      borderStyle: currentBorderStyle !== "none" ? currentBorderStyle : "solid",
      borderPreset: "custom",
    };
    if (element && onApplyElementColor) onApplyElementColor(patch);
  };

  // Cambiar propiedades de borde personalizado
  const handleCustomBorderChange = (patch: Partial<ElementOverride>) => {
    if (!isSuperAdmin && isBorderLocked) return;
    if (element && onApplyElementColor) {
      onApplyElementColor({ ...patch, borderPreset: "custom" });
    }
  };

  // Alternar regla obligatoria para la categoría (Solo Super Admin)
  const handleToggleCategoryMandatory = () => {
    if (!isSuperAdmin) return;
    const nextMandatory = !isCategoryMandatory;
    const targetScope: StyleScope = { kind: "global" };
    const currentProps = globalRule?.props ?? {
      background: "#FFFFFF",
      fill: "#FFFFFF",
      radius: "12px",
      borderWidth: "1px",
      borderColor: "#E2E8F0",
      borderStyle: "solid",
    };

    const updatedRule: StyleRule = {
      scope: targetScope,
      target: targetCategory,
      props: currentProps,
      mandatory: nextMandatory,
      lockedProps: nextMandatory ? ["fill", "background", "radius", "borderWidth", "borderColor", "borderStyle"] : [],
    };
    dispatch({ type: "rule/save", rule: updatedRule });
  };

  // Restablecer componente a valores oficiales del Manual de Marca GAMC
  const handleResetToBrandStandards = () => {
    if (!isSuperAdmin) return;
    if (element && onApplyElementColor) {
      if (isContainerElement) {
        onApplyElementColor({
          fill: "#FFFFFF",
          radius: 12,
          borderWidth: 1,
          borderColor: "#E2E8F0",
          borderStyle: "solid",
          borderPreset: "secondary",
        });
      } else if (isButtonElement) {
        onApplyElementColor({
          fill: GAMC_BRAND_TOKENS.primary,
          color: "#FFFFFF",
          radius: 8,
          borderWidth: 0,
        });
      } else if (element.kind === "text") {
        onApplyElementColor({
          color: GAMC_BRAND_TOKENS.textPrimary,
        });
      }
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-accent/40 bg-accent/5 p-3 shadow-xs">
      {/* Encabezado y Niveles de Gobernanza */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-ink">Gobernanza de Estilos</span>
            {isCategoryMandatory && (
              <span
                className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-500 border border-amber-500/30"
                title="Regla institucional obligatoria impuesta por Super Admin"
              >
                <LockClosedIcon className="size-2.5" />
                Bloqueado por Super Admin
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium text-accent">Manual GAMC</span>
        </div>

        {/* Selector de Nivel de Control (Global / Categoría / Este Componente) */}
        <div className="grid grid-cols-3 gap-1 rounded-md bg-canvas/80 p-1 text-[11px] border border-line">
          <button
            type="button"
            onClick={() => setActiveLevel("global")}
            className={`h-6 rounded font-medium transition-colors cursor-pointer ${
              activeLevel === "global"
                ? "bg-accent text-white shadow-xs font-semibold"
                : "text-ink-dim hover:text-ink hover:bg-hover"
            }`}
            title="Estilos globales aplicables a todo el portal municipal"
          >
            Global
          </button>
          <button
            type="button"
            onClick={() => setActiveLevel("category")}
            className={`h-6 rounded font-medium transition-colors cursor-pointer truncate px-1 ${
              activeLevel === "category"
                ? "bg-accent text-white shadow-xs font-semibold"
                : "text-ink-dim hover:text-ink hover:bg-hover"
            }`}
            title={`Reglas que aplican a toda la categoría ${CATEGORY_LABELS[targetCategory]}`}
          >
            {CATEGORY_LABELS[targetCategory]}
          </button>
          <button
            type="button"
            onClick={() => setActiveLevel("individual")}
            className={`h-6 rounded font-medium transition-colors cursor-pointer ${
              activeLevel === "individual"
                ? "bg-accent text-white shadow-xs font-semibold"
                : "text-ink-dim hover:text-ink hover:bg-hover"
            }`}
            title="Estilo específico de este bloque o componente"
          >
            Individual
          </button>
        </div>
      </div>

      {/* ROL DE BOTON (si el elemento seleccionado es botón) */}
      {isButtonElement && (
        <div className="flex flex-col gap-1.5 border-t border-line/60 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-ink">Rol de Botón (Manual GAMC)</label>
            <span className="text-[10px] text-ink-dim font-medium">Accesibilidad WCAG AA</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {BRAND_BUTTON_PRESETS.map((preset) => {
              const isActive = (element?.fill || "").toLowerCase() === preset.fill.toLowerCase();
              return (
                <button
                  key={preset.id}
                  type="button"
                  title={preset.description}
                  disabled={!isSuperAdmin && isFillLocked}
                  onClick={() => {
                    if (onApplyElementColor) {
                      onApplyElementColor({ fill: preset.fill, color: preset.color });
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-left text-[11px] font-medium transition-all ${
                    isActive
                      ? "border-accent ring-1 ring-accent bg-hover shadow-xs"
                      : "border-line bg-canvas hover:bg-hover"
                  } ${!isSuperAdmin && isFillLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span
                    className="size-3.5 rounded-full shrink-0 border border-black/20"
                    style={{ backgroundColor: preset.fill }}
                  />
                  <span className="truncate text-ink">{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SISTEMA CENTRALIZADO DE BORDES */}
      <div className="flex flex-col gap-2 border-t border-line/60 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-ink">Sistema de Bordes</span>
            <span
              className={`rounded px-1.5 py-0.2 text-[9px] font-semibold ${
                borderStatus === "locked"
                  ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                  : borderStatus === "custom"
                    ? "bg-accent/20 text-accent"
                    : "bg-ink-dim/10 text-ink-dim"
              }`}
            >
              {borderStatus === "locked"
                ? "Bloqueado por Super Admin"
                : borderStatus === "custom"
                  ? "Personalizado"
                  : "Heredado"}
            </span>
          </div>
          <span className="text-[10px] text-ink-dim font-mono">
            {currentBorderWidth > 0 ? `${currentBorderWidth}px ${currentBorderStyle}` : "Sin borde"}
          </span>
        </div>

        {/* 4 Presets de Bordes */}
        <div className="grid grid-cols-4 gap-1">
          <button
            type="button"
            disabled={!isSuperAdmin && isBorderLocked}
            onClick={() => handleSelectBorderPreset("primary")}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-md border p-1.5 text-center text-[10px] font-medium transition-all ${
              activeBorderPreset === "primary"
                ? "border-accent bg-accent/15 text-accent font-semibold ring-1 ring-accent shadow-xs"
                : "border-line bg-canvas text-ink hover:bg-hover"
            } ${!isSuperAdmin && isBorderLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            title="Borde primario: 2px sólido celeste institucional (#00A7D6)"
          >
            <span className="size-3.5 rounded border-2 border-[#00A7D6] bg-canvas" />
            <span>Primario</span>
          </button>

          <button
            type="button"
            disabled={!isSuperAdmin && isBorderLocked}
            onClick={() => handleSelectBorderPreset("secondary")}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-md border p-1.5 text-center text-[10px] font-medium transition-all ${
              activeBorderPreset === "secondary"
                ? "border-accent bg-accent/15 text-accent font-semibold ring-1 ring-accent shadow-xs"
                : "border-line bg-canvas text-ink hover:bg-hover"
            } ${!isSuperAdmin && isBorderLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            title="Borde secundario: 1px sólido gris sutil (#E2E8F0)"
          >
            <span className="size-3.5 rounded border border-[#E2E8F0] bg-canvas" />
            <span>Secundario</span>
          </button>

          <button
            type="button"
            disabled={!isSuperAdmin && isBorderLocked}
            onClick={() => handleSelectBorderPreset("none")}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-md border p-1.5 text-center text-[10px] font-medium transition-all ${
              activeBorderPreset === "none"
                ? "border-accent bg-accent/15 text-accent font-semibold ring-1 ring-accent shadow-xs"
                : "border-line bg-canvas text-ink hover:bg-hover"
            } ${!isSuperAdmin && isBorderLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            title="Sin borde exterior"
          >
            <span className="size-3.5 rounded border border-dashed border-line/60 bg-canvas" />
            <span>Sin borde</span>
          </button>

          <button
            type="button"
            disabled={!isSuperAdmin && isBorderLocked}
            onClick={() => handleSelectBorderPreset("custom")}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-md border p-1.5 text-center text-[10px] font-medium transition-all ${
              activeBorderPreset === "custom"
                ? "border-accent bg-accent/15 text-accent font-semibold ring-1 ring-accent shadow-xs"
                : "border-line bg-canvas text-ink hover:bg-hover"
            } ${!isSuperAdmin && isBorderLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            title="Borde personalizado con controles de ancho, estilo y color"
          >
            <span className="size-3.5 rounded border-2 border-accent border-dashed bg-canvas" />
            <span>Ajustar</span>
          </button>
        </div>

        {/* Controles expandidos de Borde Personalizado */}
        {activeBorderPreset === "custom" && (
          <div className="flex flex-col gap-2 rounded-md border border-line bg-canvas/70 p-2 text-xs">
            {/* Grosor de borde */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-ink-dim">Grosor:</span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map((w) => (
                  <button
                    key={w}
                    type="button"
                    disabled={!isSuperAdmin && isBorderLocked}
                    onClick={() => handleCustomBorderChange({ borderWidth: w })}
                    className={`size-6 rounded border text-[10px] font-semibold ${
                      currentBorderWidth === w
                        ? "border-accent bg-accent text-white"
                        : "border-line bg-canvas text-ink hover:bg-hover"
                    } cursor-pointer`}
                  >
                    {w}px
                  </button>
                ))}
              </div>
            </div>

            {/* Estilo de línea */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-ink-dim">Línea:</span>
              <div className="grid grid-cols-3 gap-1">
                {(["solid", "dashed", "dotted"] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    disabled={!isSuperAdmin && isBorderLocked}
                    onClick={() => handleCustomBorderChange({ borderStyle: style })}
                    className={`h-6 px-1.5 rounded border text-[10px] font-medium capitalize ${
                      currentBorderStyle === style
                        ? "border-accent bg-accent text-white font-semibold"
                        : "border-line bg-canvas text-ink hover:bg-hover"
                    } cursor-pointer`}
                  >
                    {style === "solid" ? "Sólida" : style === "dashed" ? "Guiones" : "Puntos"}
                  </button>
                ))}
              </div>
            </div>

            {/* Color de borde (Manual GAMC) */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-ink-dim">Color:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { hex: "#00A7D6", name: "Celeste Primario (#00A7D6)" },
                  { hex: "#462D81", name: "Morado Secundario (#462D81)" },
                  { hex: "#E2E8F0", name: "Gris Sutil (#E2E8F0)" },
                  { hex: "#0F172A", name: "Oscuro (#0F172A)" },
                  { hex: "#0DA593", name: "Verde Teal (#0DA593)" },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    disabled={!isSuperAdmin && isBorderLocked}
                    onClick={() => handleCustomBorderChange({ borderColor: c.hex })}
                    style={{ backgroundColor: c.hex }}
                    className={`size-4.5 rounded-full border ${
                      currentBorderColor === c.hex.toLowerCase()
                        ? "border-accent ring-2 ring-accent scale-110"
                        : "border-line"
                    } shadow-2xs hover:scale-125 transition-transform cursor-pointer`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SUPERFICIE Y RADIO DE ESQUINAS */}
      <div className="flex flex-col gap-2 border-t border-line/60 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-ink">Superficie y Radio</span>
            <span
              className={`rounded px-1.5 py-0.2 text-[9px] font-semibold ${
                fillStatus === "locked"
                  ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                  : fillStatus === "custom"
                    ? "bg-accent/20 text-accent"
                    : "bg-ink-dim/10 text-ink-dim"
              }`}
            >
              {fillStatus === "locked"
                ? "Bloqueado por Super Admin"
                : fillStatus === "custom"
                  ? "Personalizado"
                  : "Heredado"}
            </span>
          </div>
          <span className="text-[10px] text-ink-dim font-mono">{currentRadius}px radio</span>
        </div>

        {/* Presets de Radio de Esquinas */}
        <div className="grid grid-cols-4 gap-1">
          {[0, 8, 12, 16].map((r) => (
            <button
              key={r}
              type="button"
              disabled={!isSuperAdmin && isRadiusLocked}
              onClick={() => {
                if (element && onApplyElementColor) onApplyElementColor({ radius: r });
              }}
              className={`h-6 rounded border text-[10px] font-medium ${
                currentRadius === r
                  ? "border-accent bg-accent/20 text-accent font-semibold"
                  : "border-line bg-canvas text-ink hover:bg-hover"
              } ${!isSuperAdmin && isRadiusLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {r === 0 ? "Recto (0)" : `${r}px`}
            </button>
          ))}
        </div>

        {/* Selección de Fondo Institucional GAMC */}
        {element && (
          <div className="flex items-center gap-1.5 pt-0.5">
            <span
              className="size-7 shrink-0 rounded-md border border-line shadow-2xs"
              style={{ background: element.fill && element.fill !== "transparent" ? element.fill : "#ffffff" }}
              title={`Fondo actual: ${element.fill || "#ffffff"}`}
            />
            <select
              aria-label="Color de fondo institucional"
              disabled={!isSuperAdmin && isFillLocked}
              value={
                BRAND_SURFACE_COLORS.find(
                  (c) => c.value.toLowerCase() === (element.fill || "").toLowerCase()
                )?.value ?? ""
              }
              onChange={(e) => {
                const newFill = e.target.value;
                if (!newFill || !onApplyElementColor) return;
                onApplyElementColor({ fill: newFill });
              }}
              className={`w-full h-7 rounded border border-line bg-canvas px-1.5 text-[11px] text-ink focus:border-accent focus:outline-hidden [&>option]:bg-panel ${
                !isSuperAdmin && isFillLocked ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {!BRAND_SURFACE_COLORS.some(
                (c) => c.value.toLowerCase() === (element.fill || "").toLowerCase()
              ) && (
                <option value="" disabled>
                  Seleccionar superficie institucional...
                </option>
              )}
              {BRAND_SURFACE_COLORS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* COLOR DE TEXTO */}
      {element && (element.kind === "text" || Boolean(element.text) || element.role === "button" || element.role === "link") && (
        <div className="flex flex-col gap-1.5 border-t border-line/60 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-ink">Color de Texto</span>
            <span className="text-[10px] text-ink-dim font-mono">{element.color || "#0F172A"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="size-7 shrink-0 rounded-md border border-line shadow-2xs"
              style={{ background: element.color && element.color !== "transparent" ? element.color : "#0f172a" }}
              title={`Color actual: ${element.color || "#0f172a"}`}
            />
            <select
              aria-label="Color de texto institucional"
              value={
                BRAND_TEXT_COLORS.find(
                  (c) => c.value.toLowerCase() === (element.color || "").toLowerCase()
                )?.value ?? ""
              }
              onChange={(e) => {
                const newColor = e.target.value;
                if (!newColor || !onApplyElementColor) return;
                onApplyElementColor({ color: newColor });
              }}
              className="w-full h-7 rounded border border-line bg-canvas px-1.5 text-[11px] text-ink focus:border-accent focus:outline-hidden [&>option]:bg-panel"
            >
              {!BRAND_TEXT_COLORS.some(
                (c) => c.value.toLowerCase() === (element.color || "").toLowerCase()
              ) && (
                <option value="" disabled>
                  Seleccionar color de texto institucional...
                </option>
              )}
              {BRAND_TEXT_COLORS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ACCIONES DEL SUPER ADMIN (Imponer a la categoría / Restablecer) */}
      {isSuperAdmin && (
        <div className="flex flex-col gap-2 border-t border-accent/30 pt-2.5 mt-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
              Control Super Admin
            </span>
            <span className="text-[10px] text-ink-dim">Autoridad Global</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={handleToggleCategoryMandatory}
              className={`flex items-center justify-center gap-1.5 h-7 rounded-md border px-2 text-xs font-semibold transition-all cursor-pointer ${
                isCategoryMandatory
                  ? "border-amber-500/50 bg-amber-500/15 text-amber-500 hover:bg-amber-500/25"
                  : "border-accent/50 bg-accent/10 text-accent hover:bg-accent/20"
              }`}
              title={
                isCategoryMandatory
                  ? `Desbloquear regla obligatoria para la categoría ${CATEGORY_LABELS[targetCategory]}`
                  : `Hacer que todas las tarjetas de la categoría ${CATEGORY_LABELS[targetCategory]} respeten obligatoriamente estos estilos`
              }
            >
              {isCategoryMandatory ? (
                <>
                  <LockClosedIcon className="size-3.5" />
                  Regla obligatoria activa (Desbloquear)
                </>
              ) : (
                <>
                  <LockOpenIcon className="size-3.5" />
                  Imponer regla obligatoria a {CATEGORY_LABELS[targetCategory]}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResetToBrandStandards}
              className="flex items-center justify-center gap-1 h-7 rounded-md border border-line bg-canvas px-2 text-[11px] font-medium text-ink-dim hover:text-ink hover:bg-hover transition-colors cursor-pointer"
              title="Restablecer este elemento o tarjeta a los valores oficiales del Manual de Marca GAMC"
            >
              Restablecer a valores del Manual de Marca
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
